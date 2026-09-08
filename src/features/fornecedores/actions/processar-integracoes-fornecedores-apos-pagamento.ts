import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { checkoutPedidosTable } from "@/db/schema";
import { executarPedidoLaquila } from "@/features/fornecedores/integracoes/laquila/actions/executar-pedido-laquila";

import { orquestrarIntegracoesAposPagamento } from "../lib/orquestrar-integracoes-apos-pagamento";

function sanitizarErroPosPagamento(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";

  return mensagem
    .replace(/https:\/\/[^\s/]+\/[^\s/]+/giu, "[url-removida]")
    .replace(/\b\d{11,14}\b/gu, "[documento-removido]")
    .slice(0, 500);
}

/**
 * Entrada única dos gateways após uma confirmação confiável.
 * O estado é relido no servidor e a integração não confia no payload recebido.
 */
export async function processarIntegracoesFornecedoresAposPagamento(
  pedidoId: string,
) {
  const [pedido] = await db
    .select({
      pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
      status: checkoutPedidosTable.status,
    })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);

  if (!pedido) throw new Error("Pedido não encontrado no pós-pagamento.");

  if (["canceled", "refunded", "expired"].includes(pedido.status)) {
    return {
      estado: "ignorado_pedido_inelegivel" as const,
      integracoes: [],
    };
  }

  return orquestrarIntegracoesAposPagamento({
    pedidoId,
    pagamentoStatus: pedido.pagamentoStatus,
    pedidoStatus: pedido.status,
    dependencias: {
      processarLaquila: (id) => executarPedidoLaquila(id),
    },
  });
}

/** Uma falha do fornecedor não pode desfazer nem esconder o pagamento aprovado. */
export async function processarIntegracoesFornecedoresAposPagamentoSeguro(
  pedidoId: string,
) {
  try {
    return await processarIntegracoesFornecedoresAposPagamento(pedidoId);
  } catch (erro) {
    const erroSanitizado = sanitizarErroPosPagamento(erro);
    console.error("[fornecedores:pos-pagamento:erro]", {
      pedidoId,
      erro: erroSanitizado,
    });

    return {
      estado: "erro_operacional" as const,
      integracoes: [],
      erro: erroSanitizado,
    };
  }
}
