import "server-only";

import { and, eq } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

/** Retorna o Pix somente ao usuário proprietário do pedido. */
export async function buscarPixPedidoClientePorId({
  pedidoId,
  usuarioId,
}: {
  pedidoId: string;
  usuarioId: string;
}) {
  const [pix] = await dbTransacional
    .select({
      pedidoId: checkoutPedidosTable.id,
      numeroPedido: checkoutPedidosTable.numeroPedido,
      totalEmCentavos: checkoutPedidosTable.totalEmCentavos,
      pagamentoStatus: checkoutPagamentosTable.status,
      gateway: checkoutPagamentosTable.gateway,
      metodo: checkoutPagamentosTable.metodo,
      pixTxid: checkoutPagamentosTable.pixTxid,
      qrCode: checkoutPagamentosTable.qrCode,
      copiaECola: checkoutPagamentosTable.copiaECola,
      expiresAt: checkoutPagamentosTable.expiresAt,
    })
    .from(checkoutPedidosTable)
    .innerJoin(
      checkoutClientesTable,
      eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
    )
    .innerJoin(
      checkoutPagamentosTable,
      eq(checkoutPagamentosTable.pedidoId, checkoutPedidosTable.id),
    )
    .where(
      and(
        eq(checkoutPedidosTable.id, pedidoId),
        eq(checkoutClientesTable.userId, usuarioId),
      ),
    )
    .limit(1);

  if (
    !pix ||
    pix.gateway !== "efibank" ||
    pix.metodo !== "pix" ||
    !pix.pixTxid ||
    !pix.qrCode ||
    !pix.copiaECola ||
    !pix.expiresAt
  ) {
    return null;
  }

  return {
    pedidoId: pix.pedidoId,
    numeroPedido: pix.numeroPedido,
    totalEmCentavos: pix.totalEmCentavos,
    pagamentoStatus: pix.pagamentoStatus,
    txid: pix.pixTxid,
    qrCode: pix.qrCode,
    copiaECola: pix.copiaECola,
    expiresAt: pix.expiresAt,
  };
}
