import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import {
  checkoutPedidoHistoricosTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  fornecedorPedidoIntegracoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { obterAmbienteAplicacaoLaquila } from "../../lib/ambiente-laquila";
import {
  consultarPedidoLaquila,
  criarClienteLaquila,
} from "../../lib/cliente-laquila";
import { podeCancelarPedidoPorFornecedor } from "../../lib/reconciliacao/decidir-cancelamento-operacional";
import { lerSincronizacaoPedidoLaquila } from "../../lib/reconciliacao/estado-pedido-laquila";
import { reconciliarPedidosLaquila } from "../../lib/reconciliacao/reconciliar-pedidos-laquila";
import { buscarConfiguracaoLaquilaAdmin } from "../../queries/buscar-configuracao-laquila";

const tabela = fornecedorPedidoIntegracoesTable;
const DURACAO_CONCESSAO_MS = 3 * 60 * 1000;
const LIMITE_LOTE = 5;

function elegivel(agora: string) {
  return sql`coalesce(${tabela.payloadSanitizado}->'reconciliacao00008'->'ultimoEstado'->>'terminal', 'false') <> 'true'
    and coalesce(${tabela.payloadSanitizado}->'reconciliacao00008'->>'proximaConsultaEm', '') <= ${agora}
    and coalesce(${tabela.payloadSanitizado}->'concessaoReconciliacao00008'->>'ate', '') <= ${agora}`;
}

/**
 * Job permanente de leitura 00008. Não importa criação, estoque, gateways nem
 * cancelamento financeiro. Todas as escritas são na evidência operacional local.
 */
export async function executarReconciliacaoLaquila() {
  const ambiente = obterAmbienteAplicacaoLaquila();
  const configuracao = await buscarConfiguracaoLaquilaAdmin({ ambiente });
  if (!configuracao?.ativo || !configuracao.tokenCliente)
    throw new Error("Configuração Laquila indisponível para reconciliação.");
  const token = configuracao.tokenCliente;
  const cliente = criarClienteLaquila(
    { ...configuracao, tokenClienteCriptografado: null },
    15_000,
  );

  return reconciliarPedidosLaquila({
    agora: () => new Date(),
    segredos: [token, configuracao.urlBase ?? ""],
    async listar() {
      const linhas = await dbTransacional
        .select({
          id: tabela.id,
          pedidoId: tabela.pedidoId,
          idPedidoExterno: tabela.idPedidoExterno,
          fornecedorId: tabela.fornecedorId,
        })
        .from(tabela)
        .innerJoin(
          checkoutPedidosTable,
          eq(checkoutPedidosTable.id, tabela.pedidoId),
        )
        .where(
          and(
            eq(tabela.provedor, "laquila"),
            eq(tabela.ambiente, ambiente),
            eq(tabela.fornecedorId, configuracao.fornecedorId),
            eq(tabela.status, "criado"),
            isNotNull(tabela.idPedidoExterno),
            inArray(checkoutPedidosTable.status, [
              "pending",
              "paid",
              "processing",
              "shipped",
            ]),
            elegivel(new Date().toISOString()),
          ),
        )
        .orderBy(
          sql`coalesce(${tabela.payloadSanitizado}->'reconciliacao00008'->>'proximaConsultaEm', '')`,
          tabela.id,
        )
        .limit(LIMITE_LOTE);
      return linhas.flatMap((linha) =>
        linha.idPedidoExterno?.trim()
          ? [{ ...linha, idPedidoExterno: linha.idPedidoExterno }]
          : [],
      );
    },
    async adquirir(candidato) {
      const agora = new Date();
      const concessao = randomUUID();
      // Compare-and-set no Postgres: só um worker consulta cada integração.
      const [registro] = await dbTransacional
        .update(tabela)
        .set({
          payloadSanitizado: sql`jsonb_set(${tabela.payloadSanitizado}, '{concessaoReconciliacao00008}', ${JSON.stringify({ id: concessao, ate: new Date(agora.getTime() + DURACAO_CONCESSAO_MS).toISOString() })}::jsonb)`,
          updatedAt: agora,
        })
        .where(
          and(
            eq(tabela.id, candidato.id),
            eq(tabela.ambiente, ambiente),
            eq(tabela.status, "criado"),
            elegivel(agora.toISOString()),
          ),
        )
        .returning({ payload: tabela.payloadSanitizado });
      return registro
        ? {
            concessao,
            anterior: lerSincronizacaoPedidoLaquila(
              registro.payload.reconciliacao00008,
            ),
          }
        : null;
    },
    consultar: (candidato) =>
      consultarPedidoLaquila({
        cliente,
        tokenCliente: token,
        idPedido: candidato.idPedidoExterno,
      }),
    async persistir(candidato, concessao, sincronizacao) {
      return dbTransacional.transaction(async (tx) => {
        // Serializa a projeção de vários grupos do mesmo pedido, sem manter
        // transação/conexão aberta durante a chamada HTTP ao fornecedor.
        const [pedido] = await tx
          .select()
          .from(checkoutPedidosTable)
          .where(eq(checkoutPedidosTable.id, candidato.pedidoId))
          .for("update");
        if (!pedido) return false;
        const [integracao] = await tx
          .select()
          .from(tabela)
          .where(
            and(eq(tabela.id, candidato.id), eq(tabela.ambiente, ambiente)),
          )
          .for("update");
        const lease = integracao?.payloadSanitizado
          .concessaoReconciliacao00008 as { id?: string } | undefined;
        if (!integracao || lease?.id !== concessao) return false;

        if (sincronizacao.ultimoEstado?.estado === "cancelado") {
          const [logistica] = await tx
            .select({
              snapshot: checkoutPedidoLogisticasTable.snapshotFrete,
              dataEnvio: checkoutPedidoLogisticasTable.dataEnvio,
              dataEntrega: checkoutPedidoLogisticasTable.dataEntrega,
            })
            .from(checkoutPedidoLogisticasTable)
            .where(eq(checkoutPedidoLogisticasTable.pedidoId, pedido.id));
          const itens = await tx
            .select({
              produtoId: checkoutPedidoItensTable.produtoId,
              varianteId: checkoutPedidoItensTable.varianteId,
              quantidade: checkoutPedidoItensTable.quantidade,
            })
            .from(checkoutPedidoItensTable)
            .where(eq(checkoutPedidoItensTable.pedidoId, pedido.id));
          const integracoes = await tx
            .select({
              chave: tabela.chaveGrupo,
              payload: tabela.payloadSanitizado,
            })
            .from(tabela)
            .where(
              and(
                eq(tabela.pedidoId, pedido.id),
                eq(tabela.provedor, "laquila"),
                eq(tabela.ambiente, ambiente),
              ),
            );
          const cancelados = new Set(
            integracoes
              .filter(
                (i) =>
                  i.chave === integracao.chaveGrupo ||
                  lerSincronizacaoPedidoLaquila(i.payload.reconciliacao00008)
                    ?.ultimoEstado?.estado === "cancelado",
              )
              .map((i) => i.chave),
          );
          const grupos =
            logistica?.snapshot?.versao === "2"
              ? logistica.snapshot.grupos
              : [];
          const deveCancelar =
            !logistica?.dataEnvio &&
            !logistica?.dataEntrega &&
            podeCancelarPedidoPorFornecedor({
              status: pedido.status,
              grupos,
              itens,
              gruposCancelados: cancelados,
            });
          if (deveCancelar) {
            // Cancela apenas a operação. Nenhum campo de pagamento é alterado,
            // nenhum serviço de estorno é chamado e não há reposição fictícia.
            await tx
              .update(checkoutPedidosTable)
              .set({ status: "canceled", updatedAt: new Date() })
              .where(eq(checkoutPedidosTable.id, pedido.id));
            await tx.insert(checkoutPedidoHistoricosTable).values({
              pedidoId: pedido.id,
              tipo: "pedido_cancelado",
              origem: "system",
              statusAnterior: pedido.status,
              statusNovo: "canceled",
              descricao:
                "Pedido cancelado após confirmação da operação de entrega. O pagamento permanece registrado; a questão financeira será tratada separadamente.",
              metadata: {
                operacao: "reconciliacao_fornecedor",
                integracaoId: integracao.id,
              },
            });
          } else if (pedido.status !== "canceled") {
            sincronizacao.revisaoOperacional =
              "Cancelamento externo exige análise do pedido misto ou já expedido; status global preservado.";
          }
        }
        const { concessaoReconciliacao00008: removida, ...payload } =
          integracao.payloadSanitizado;
        void removida;
        await tx
          .update(tabela)
          .set({
            payloadSanitizado: {
              ...payload,
              reconciliacao00008: sincronizacao,
            },
            updatedAt: new Date(),
          })
          .where(eq(tabela.id, integracao.id));
        return true;
      });
    },
  });
}
