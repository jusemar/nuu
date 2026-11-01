import "server-only";

import { eq } from "drizzle-orm";

import {
  checkoutItemComissaoEventosTable,
  checkoutItemComissoesTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
export type TransacaoComissoesPedido = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];
/** Savepoint isola falha opcional da comissão: nunca impede pagamento/cancelamento. */
export async function processarComissoesPedidoSeguro(
  tx: TransacaoComissoesPedido,
  pedidoId: string,
) {
  try {
    return await tx.transaction(async (sp) => {
      const [pedido] = await sp
        .select()
        .from(checkoutPedidosTable)
        .where(eq(checkoutPedidosTable.id, pedidoId))
        .for("update");
      if (!pedido) return;
      const tipo: "confirmada" | "cancelada" | "estornada" | null =
        pedido.status === "refunded"
          ? "estornada"
          : pedido.status === "canceled"
            ? "cancelada"
            : pedido.pagamentoStatus === "paid" &&
                ["paid", "processing", "shipped", "delivered"].includes(
                  pedido.status,
                )
              ? "confirmada"
              : null;
      if (!tipo) return;
      const snapshots = await sp
        .select({ id: checkoutItemComissoesTable.id })
        .from(checkoutItemComissoesTable)
        .where(eq(checkoutItemComissoesTable.pedidoId, pedidoId));
      if (!snapshots.length) return;
      await sp
        .insert(checkoutItemComissaoEventosTable)
        .values(snapshots.map((s) => ({ comissaoId: s.id, tipo })))
        .onConflictDoNothing({
          target: [
            checkoutItemComissaoEventosTable.comissaoId,
            checkoutItemComissaoEventosTable.tipo,
          ],
        });
      return true;
    });
  } catch {
    console.error("[comissoes:reprocessamento-pendente]", { pedidoId });
    return false;
  }
}
