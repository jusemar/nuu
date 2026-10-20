"use server";

import { eq } from "drizzle-orm";

import { checkoutPagamentosTable, checkoutPedidosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { criarCobrancaPixEfi } from "@/features/checkout/lib/gateways/efi/pix-efi";
import { checkoutVisitanteSchema } from "@/features/checkout/schemas/checkout.schema";
import { processarReservaPedido } from "@/features/programa-fidelidade/lib/processar-resgate-fidelidade";

import { criarPedidoRecompensaInterno } from "./criar-pedido-recompensa";

/** Fronteira pública: a identidade é resolvida exclusivamente pela sessão Better Auth. */
export async function criarPedidoRecompensa(entrada: unknown) {
  const dados = checkoutVisitanteSchema.parse(entrada);
  const sessao = await buscarSessaoCliente();
  if (!sessao) throw new Error("CLIENTE_AUTENTICADO_NECESSARIO");
  const pedido = await criarPedidoRecompensaInterno({ dados, usuarioId: sessao.usuario.id });
  if (pedido.jaExistia || pedido.totalEmCentavos === 0) return pedido;
  if (!pedido.pagamentoId || !pedido.numeroPedido || !pedido.nomeCliente || !pedido.documentoCliente) {
    throw new Error("PAGAMENTO_RECOMPENSA_INCOMPLETO");
  }
  try {
    const pix = await criarCobrancaPixEfi({
      numeroPedido: pedido.numeroPedido,
      nome: pedido.nomeCliente,
      documento: pedido.documentoCliente,
      valorEmCentavos: pedido.totalEmCentavos,
    });
    await dbTransacional.update(checkoutPagamentosTable).set({
      pixTxid: pix.txid,
      transactionId: pix.txid,
      qrCode: pix.qrCode,
      copiaECola: pix.copiaECola,
      expiresAt: pix.expiresAt,
      providerResponse: pix.providerResponse,
      updatedAt: new Date(),
    }).where(eq(checkoutPagamentosTable.id, pedido.pagamentoId));
    return { ...pedido, pix: { txid: pix.txid, qrCode: pix.qrCode, copiaECola: pix.copiaECola } };
  } catch (erro) {
    await dbTransacional.transaction(async (tx) => {
      await processarReservaPedido(tx, pedido.pedidoId, "liberar", "falha_criacao_cobranca");
      await tx.update(checkoutPagamentosTable).set({ status: "failed", updatedAt: new Date() })
        .where(eq(checkoutPagamentosTable.id, pedido.pagamentoId!));
      await tx.update(checkoutPedidosTable).set({ pagamentoStatus: "failed", updatedAt: new Date() })
        .where(eq(checkoutPedidosTable.id, pedido.pedidoId));
    });
    throw erro;
  }
}
