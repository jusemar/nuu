import "server-only";

import { eq } from "drizzle-orm";

import { checkoutPedidosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { PagamentoStatusCheckout } from "../../types/pedidos-pagamentos.types";

export async function buscarStatusPagamentoPedidoSucesso(
  numeroPedido?: string,
): Promise<PagamentoStatusCheckout | null> {
  if (!numeroPedido) {
    return null;
  }

  const pedido = await dbTransacional.query.checkoutPedidosTable.findFirst({
    columns: {
      pagamentoStatus: true,
    },
    where: eq(checkoutPedidosTable.numeroPedido, numeroPedido),
  });

  return pedido?.pagamentoStatus ?? null;
}
