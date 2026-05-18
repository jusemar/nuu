import "server-only";

import { desc, eq, inArray } from "drizzle-orm";

import { checkoutClientesTable, checkoutPedidosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { PedidoClienteListaItem } from "../../types/pedidos-cliente.types";

export async function listarPedidosCliente({
  usuarioId,
}: {
  usuarioId: string;
}): Promise<PedidoClienteListaItem[]> {
  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.userId, usuarioId));

  if (clientes.length === 0) {
    return [];
  }

  const clientesIds = clientes.map((cliente) => cliente.id);
  const pedidos = await dbTransacional.query.checkoutPedidosTable.findMany({
    where: inArray(checkoutPedidosTable.clienteId, clientesIds),
    orderBy: [desc(checkoutPedidosTable.createdAt)],
    with: {
      pagamentos: true,
    },
  });

  return pedidos.map((pedido) => {
    const pagamento = pedido.pagamentos[0] ?? null;

    return {
      id: pedido.id,
      numeroPedido: pedido.numeroPedido,
      createdAt: pedido.createdAt,
      status: pedido.status,
      pagamentoStatus: pedido.pagamentoStatus,
      totalEmCentavos: pedido.totalEmCentavos,
      metodoPagamento: pagamento?.metodo ?? null,
    };
  });
}
