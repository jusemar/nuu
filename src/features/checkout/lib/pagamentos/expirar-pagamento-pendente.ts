import { and, eq, sql } from "drizzle-orm";

import {
  checkoutPagamentosTable,
  checkoutPedidoHistoricosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { processarReservaPedido } from "@/features/programa-fidelidade/lib/processar-resgate-fidelidade";

type TransacaoBanco = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

export async function expirarPagamentoPendente({
  tx,
  pedidoId,
  pagamentoId,
  gateway,
  referencia,
}: {
  tx: TransacaoBanco;
  pedidoId: string;
  pagamentoId: string;
  gateway: "stripe" | "efibank";
  referencia: string;
}) {
  const [pedidoAnterior] = await tx
    .select({
      status: checkoutPedidosTable.status,
      pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
    })
    .from(checkoutPedidosTable)
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);

  if (!pedidoAnterior || pedidoAnterior.pagamentoStatus !== "pending") {
    return { expiradoAgora: false };
  }

  // O UPDATE na linha do pagamento é a trava da operação. Se um webhook pago chegou
  // antes, o status já não é `pending` e nenhuma expiração acontece.
  const pagamentosAtualizados = await tx
    .update(checkoutPagamentosTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(checkoutPagamentosTable.id, pagamentoId),
        eq(checkoutPagamentosTable.pedidoId, pedidoId),
        eq(checkoutPagamentosTable.status, "pending"),
      ),
    )
    .returning({ id: checkoutPagamentosTable.id });

  if (pagamentosAtualizados.length === 0) {
    return { expiradoAgora: false };
  }

  const [pedidoAtualizado] = await tx
    .update(checkoutPedidosTable)
    .set({
      pagamentoStatus: "expired",
      // Cancelamento é um estado operacional mais forte e não deve ser apagado. Somente
      // pedidos ainda pendentes acompanham o pagamento para `expired`.
      status: sql`case when ${checkoutPedidosTable.status} = 'pending' then 'expired'::checkout_pedido_status else ${checkoutPedidosTable.status} end`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(checkoutPedidosTable.id, pedidoId),
        eq(checkoutPedidosTable.pagamentoStatus, "pending"),
      ),
    )
    .returning({ status: checkoutPedidosTable.status });

  if (pedidoAtualizado) {
    await processarReservaPedido(tx, pedidoId, "liberar", "pagamento_expirado");
    await tx.insert(checkoutPedidoHistoricosTable).values({
      pedidoId,
      tipo: "status_alterado_manual",
      descricao: "Pagamento expirado automaticamente.",
      origem: "system",
      statusAnterior: pedidoAnterior.status,
      statusNovo: pedidoAtualizado.status,
      metadata: { gateway, referencia, operacao: "expiracao_pagamento" },
    });
  }

  return { expiradoAgora: true };
}
