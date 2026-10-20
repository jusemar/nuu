import { eq, sql } from "drizzle-orm";

import { checkoutPedidosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { resolverStatusOperacionalPedidoAposPagamento } from "../../lib/pedidos/resolver-status-operacional-pedido";
import { reobterRecursosPedidoPago } from "../estoque/reobter-recursos-pedido-pago";

type TransacaoBanco = Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0];

/**
 * A cobrança já foi confirmada pelo gateway dentro desta transação. Este núcleo
 * distingue dinheiro recebido de autorização para atender o pedido.
 */
export async function confirmarPagamentoRecebido(
  tx: TransacaoBanco,
  pedidoId: string,
): Promise<{ recursos: "prontos" | "indisponiveis"; statusOperacional: typeof checkoutPedidosTable.$inferSelect.status }> {
  // Cancelamento, expiração, envio e confirmação disputam a mesma linha.
  await tx.execute(sql`select id from checkout_pedidos where id = ${pedidoId} for update`);
  const [pedido] = await tx.select({
    status: checkoutPedidosTable.status,
    pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
  })
    .from(checkoutPedidosTable).where(eq(checkoutPedidosTable.id, pedidoId));
  if (!pedido) throw new Error("PEDIDO_PAGAMENTO_NAO_ENCONTRADO");

  // Um webhook/reconciliador repetido não re-reserva pontos já consumidos nem
  // tenta realocar estoque novamente depois do primeiro commit bem-sucedido.
  if (pedido.pagamentoStatus === "paid") {
    return {
      recursos: ["processing", "paid", "shipped", "delivered"].includes(pedido.status)
        ? "prontos"
        : "indisponiveis",
      statusOperacional: pedido.status,
    };
  }

  if (["canceled", "refunded", "shipped", "delivered"].includes(pedido.status)) {
    await tx.update(checkoutPedidosTable)
      .set({ pagamentoStatus: "paid", updatedAt: new Date() })
      .where(eq(checkoutPedidosTable.id, pedidoId));
    return { recursos: "indisponiveis", statusOperacional: pedido.status };
  }

  const recursos = await reobterRecursosPedidoPago(tx, pedidoId);
  const statusOperacional = recursos === "prontos"
    ? resolverStatusOperacionalPedidoAposPagamento(pedido.status)
    : "pagamento_recebido_sem_recursos" as const;
  await tx.update(checkoutPedidosTable)
    .set({ status: statusOperacional, pagamentoStatus: "paid", updatedAt: new Date() })
    .where(eq(checkoutPedidosTable.id, pedidoId));
  return { recursos, statusOperacional };
}
