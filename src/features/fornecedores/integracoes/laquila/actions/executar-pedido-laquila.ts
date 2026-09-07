import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorPedidoIntegracoesTable } from "@/db/schema";

import { obterAmbienteAplicacaoLaquila } from "../lib/ambiente-laquila";
import {
  consultarPedidoLaquila,
  consultarSaldoPrecoLaquila,
  criarClienteLaquila,
  inserirPedidoLaquila,
} from "../lib/cliente-laquila";
import {
  processarGruposPedidoLaquila,
  type RepositorioPedidoLaquila,
} from "../lib/processar-grupos-pedido-laquila";
import { revalidarEstoqueItensPedidoLaquila } from "../lib/revalidar-estoque-pedido-laquila";
import { prepararPedidoLaquila } from "../queries/preparar-pedido-laquila";

const repositorio: RepositorioPedidoLaquila = {
  async persistirPendente(grupo) {
    await db
      .insert(fornecedorPedidoIntegracoesTable)
      .values({
        pedidoId: grupo.pedidoId,
        fornecedorId: grupo.fornecedorId,
        provedor: "laquila",
        ambiente: grupo.ambiente,
        chaveGrupo: grupo.chaveGrupo,
        chaveIdempotencia: grupo.chaveIdempotencia,
        hashPayload: grupo.hashPayload,
        status: "pendente",
        cdTransportador: grupo.pedidoSemCredenciais.cd_transportador,
        payloadSanitizado: grupo.payloadSanitizado,
      })
      .onConflictDoNothing();
  },

  async buscar(grupo) {
    const [registro] = await db
      .select()
      .from(fornecedorPedidoIntegracoesTable)
      .where(
        and(
          eq(fornecedorPedidoIntegracoesTable.pedidoId, grupo.pedidoId),
          eq(fornecedorPedidoIntegracoesTable.provedor, "laquila"),
          eq(fornecedorPedidoIntegracoesTable.ambiente, grupo.ambiente),
          eq(fornecedorPedidoIntegracoesTable.chaveGrupo, grupo.chaveGrupo),
        ),
      )
      .limit(1);

    if (!registro) {
      throw new Error("Não foi possível persistir a integração Laquila.");
    }

    return registro;
  },

  async adquirir(registro, hashAtual) {
    const [adquirido] = await db
      .update(fornecedorPedidoIntegracoesTable)
      .set({
        status: "processando",
        erroSanitizado: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fornecedorPedidoIntegracoesTable.id, registro.id),
          inArray(fornecedorPedidoIntegracoesTable.status, [
            "pendente",
            "falha",
          ]),
          eq(fornecedorPedidoIntegracoesTable.hashPayload, hashAtual),
        ),
      )
      .returning();

    return adquirido ?? null;
  },

  async registrarTentativa(id) {
    const [registro] = await db
      .update(fornecedorPedidoIntegracoesTable)
      .set({
        tentativas: sql`${fornecedorPedidoIntegracoesTable.tentativas} + 1`,
        ultimaTentativaEm: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fornecedorPedidoIntegracoesTable.id, id),
          eq(fornecedorPedidoIntegracoesTable.status, "processando"),
        ),
      )
      .returning();

    if (!registro) {
      throw new Error("Tentativa Laquila não pôde ser registrada.");
    }

    return registro;
  },

  async finalizar(id, atualizacao) {
    const [registro] = await db
      .update(fornecedorPedidoIntegracoesTable)
      .set({
        status: atualizacao.status,
        idPedidoExterno: atualizacao.idPedidoExterno,
        erroSanitizado: atualizacao.erroSanitizado,
        updatedAt: new Date(),
      })
      .where(eq(fornecedorPedidoIntegracoesTable.id, id))
      .returning();

    if (!registro) {
      throw new Error("Integração Laquila não pôde ser finalizada.");
    }

    return registro;
  },

  async registrarConsulta(id, resumo) {
    const [atual] = await db
      .select({
        payloadSanitizado: fornecedorPedidoIntegracoesTable.payloadSanitizado,
      })
      .from(fornecedorPedidoIntegracoesTable)
      .where(eq(fornecedorPedidoIntegracoesTable.id, id))
      .limit(1);

    if (!atual) {
      throw new Error(
        "Integração Laquila não encontrada para registrar 00008.",
      );
    }

    const [registro] = await db
      .update(fornecedorPedidoIntegracoesTable)
      .set({
        payloadSanitizado: {
          ...atual.payloadSanitizado,
          consulta00008: resumo,
        },
        erroSanitizado: resumo.sucesso
          ? null
          : (resumo.erro ?? "A consulta 00008 não confirmou o pedido Laquila."),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(fornecedorPedidoIntegracoesTable.id, id),
          eq(fornecedorPedidoIntegracoesTable.status, "criado"),
        ),
      )
      .returning();

    if (!registro) {
      throw new Error("Consulta 00008 não pôde ser registrada.");
    }

    return registro;
  },
};

function criarClienteDoGrupo(
  grupo: Parameters<typeof processarGruposPedidoLaquila>[0][number],
  timeoutMs?: number,
) {
  return criarClienteLaquila(
    {
      id: grupo.credenciais.configuracao.id,
      ambiente: grupo.ambiente,
      urlBase: grupo.credenciais.configuracao.urlBase,
      cnpjEmpresa: grupo.credenciais.configuracao.cnpjEmpresa,
      tokenClienteCriptografado: null,
    },
    timeoutMs,
  );
}

/** Núcleo interno usado igualmente pela ação administrativa e pelo pós-pagamento. */
export async function executarPedidoLaquila(
  pedidoId: string,
  opcoes: { permitirReprocessarFalhaComTentativa?: boolean } = {},
) {
  const ambiente = obterAmbienteAplicacaoLaquila();
  const grupos = await prepararPedidoLaquila(pedidoId, ambiente);

  return processarGruposPedidoLaquila(
    grupos,
    {
      repositorio,
      async revalidarEstoque(grupo) {
        const resultado = await consultarSaldoPrecoLaquila({
          cliente: criarClienteDoGrupo(grupo, 120_000),
          tokenCliente: grupo.credenciais.tokenCliente,
          pagina: 1,
          itensPorPagina: 10_000,
          codigoItem: "",
        });

        if (!resultado.sucesso) {
          return {
            sucesso: false as const,
            erro: `Não foi possível revalidar o estoque Laquila: ${resultado.erro}`,
          };
        }

        return revalidarEstoqueItensPedidoLaquila(
          grupo.pedidoSemCredenciais.itens,
          resultado.itens,
        );
      },
      async enviarPedido(grupo, corpo) {
        return inserirPedidoLaquila(criarClienteDoGrupo(grupo), corpo);
      },
      async consultarPedido(grupo, idPedidoExterno) {
        return consultarPedidoLaquila({
          cliente: criarClienteDoGrupo(grupo),
          tokenCliente: grupo.credenciais.tokenCliente,
          idPedido: idPedidoExterno,
        });
      },
    },
    opcoes,
  );
}
