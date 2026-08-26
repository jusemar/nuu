"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorPedidoIntegracoesTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirAcessoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { obterAmbienteAplicacaoLaquila } from "../lib/ambiente-laquila";
import {
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
    if (!registro)
      throw new Error("Tentativa Laquila não pôde ser registrada.");
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
    if (!registro)
      throw new Error("Integração Laquila não pôde ser finalizada.");
    return registro;
  },
};

/** Não é chamada pelos webhooks até a execução real ser aprovada. */
export async function processarPedidoLaquila00002(pedidoId: string) {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
  const ambiente = obterAmbienteAplicacaoLaquila();
  const grupos = await prepararPedidoLaquila(pedidoId, ambiente);

  return processarGruposPedidoLaquila(grupos, {
    repositorio,
    async revalidarEstoque(grupo) {
      const cliente = criarClienteLaquila(
        {
          id: grupo.credenciais.configuracao.id,
          ambiente: grupo.ambiente,
          urlBase: grupo.credenciais.configuracao.urlBase,
          cnpjEmpresa: grupo.credenciais.configuracao.cnpjEmpresa,
          tokenClienteCriptografado: null,
        },
        120_000,
      );
      const resultado = await consultarSaldoPrecoLaquila({
        cliente,
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
      const cliente = criarClienteLaquila({
        id: grupo.credenciais.configuracao.id,
        ambiente: grupo.ambiente,
        urlBase: grupo.credenciais.configuracao.urlBase,
        cnpjEmpresa: grupo.credenciais.configuracao.cnpjEmpresa,
        tokenClienteCriptografado: null,
      });
      return inserirPedidoLaquila(cliente, corpo);
    },
  });
}
