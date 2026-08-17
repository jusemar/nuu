"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorPedidoIntegracoesTable } from "@/db/schema";

import {
  consultarSaldoPrecoLaquila,
  criarClienteLaquila,
} from "../lib/cliente-laquila";
import { decidirExecucaoPedidoLaquila } from "../lib/decidir-execucao-pedido-laquila";
import { revalidarEstoqueItensPedidoLaquila } from "../lib/revalidar-estoque-pedido-laquila";
import { prepararPedidoLaquila } from "../queries/preparar-pedido-laquila";

/**
 * Prepara e persiste o estado pendente, mas deliberadamente não adquire a trava
 * de envio e não possui dependência do método 00002.
 */
export async function prepararPedidoLaquilaDryRun(pedidoId: string) {
  const grupos = await prepararPedidoLaquila(pedidoId);
  const resultados = [];

  for (const grupo of grupos) {
    await db
      .insert(fornecedorPedidoIntegracoesTable)
      .values({
        pedidoId: grupo.pedidoId,
        fornecedorId: grupo.fornecedorId,
        provedor: "laquila",
        chaveGrupo: grupo.chaveGrupo,
        chaveIdempotencia: grupo.chaveIdempotencia,
        hashPayload: grupo.hashPayload,
        status: "pendente",
        cdTransportador: grupo.pedidoSemCredenciais.cd_transportador,
        payloadSanitizado: grupo.payloadSanitizado,
      })
      .onConflictDoNothing();

    const [registro] = await db
      .select()
      .from(fornecedorPedidoIntegracoesTable)
      .where(
        and(
          eq(fornecedorPedidoIntegracoesTable.pedidoId, grupo.pedidoId),
          eq(fornecedorPedidoIntegracoesTable.provedor, "laquila"),
          eq(fornecedorPedidoIntegracoesTable.chaveGrupo, grupo.chaveGrupo),
        ),
      )
      .limit(1);
    if (!registro)
      throw new Error("Integração Laquila não pôde ser preparada.");

    const decisao = decidirExecucaoPedidoLaquila({
      status: registro.status,
      hashPersistido: registro.hashPayload,
      hashAtual: grupo.hashPayload,
    });
    if (decisao === "hash_divergente") {
      throw new Error("Payload Laquila divergiu no dry-run.");
    }
    if (registro.status !== "pendente" && registro.status !== "falha") {
      throw new Error(
        `Dry-run bloqueado pelo estado idempotente ${registro.status}.`,
      );
    }

    const cliente = criarClienteLaquila(
      {
        id: grupo.credenciais.configuracao.id,
        urlBase: grupo.credenciais.configuracao.urlBase,
        cnpjEmpresa: grupo.credenciais.configuracao.cnpjEmpresa,
        tokenClienteCriptografado: null,
      },
      120_000,
    );
    const saldo = await consultarSaldoPrecoLaquila({
      cliente,
      tokenCliente: grupo.credenciais.tokenCliente,
      pagina: 1,
      itensPorPagina: 10_000,
      codigoItem: "",
    });
    if (!saldo.sucesso) {
      throw new Error(`Falha ao revalidar estoque no dry-run: ${saldo.erro}`);
    }

    const estoque = revalidarEstoqueItensPedidoLaquila(
      grupo.pedidoSemCredenciais.itens,
      saldo.itens,
    );
    if (!estoque.sucesso) throw new Error(estoque.erro);

    const payloadSanitizado = {
      pedido: {
        cnpj_empresa: "***",
        token: "***",
        cpf_cnpj: "***",
        cpf_cnpj_consulta: "***",
        nm_cliente: grupo.pedidoSemCredenciais.nm_cliente,
        email: "***",
        nr_celular: "***",
        cd_transportador: grupo.pedidoSemCredenciais.cd_transportador,
        itens: grupo.pedidoSemCredenciais.itens,
      },
    };
    const jsonCamposNaoSensiveis = JSON.stringify({
      pedido: {
        cd_transportador: grupo.pedidoSemCredenciais.cd_transportador,
        itens: grupo.pedidoSemCredenciais.itens,
      },
    });

    resultados.push({
      registroId: registro.id,
      status: registro.status,
      idPedidoExterno: registro.idPedidoExterno,
      tentativas: registro.tentativas,
      ultimaTentativaEm: registro.ultimaTentativaEm,
      chaveGrupo: grupo.chaveGrupo,
      chaveIdempotencia: grupo.chaveIdempotencia,
      hashPayload: grupo.hashPayload,
      estoque: estoque.itens,
      payloadSanitizado,
      jsonCamposNaoSensiveis,
    });
  }

  return resultados;
}
