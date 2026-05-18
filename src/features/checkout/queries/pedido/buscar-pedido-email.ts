import "server-only";

import { eq } from "drizzle-orm";

import { checkoutPedidosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { EmailPedidoResumo } from "../../lib/emails/types";

export async function buscarPedidoEmailPorId(
  pedidoId: string,
): Promise<EmailPedidoResumo | null> {
  const pedido = await dbTransacional.query.checkoutPedidosTable.findFirst({
    where: eq(checkoutPedidosTable.id, pedidoId),
    with: {
      cliente: true,
      itens: true,
    },
  });

  if (!pedido) {
    return null;
  }

  return {
    numeroPedido: pedido.numeroPedido,
    nomeCliente: pedido.cliente.nome,
    emailCliente: pedido.cliente.email,
    subtotalEmCentavos: pedido.subtotalEmCentavos,
    freteEmCentavos: pedido.freteEmCentavos,
    descontoEmCentavos: pedido.descontoEmCentavos,
    totalEmCentavos: pedido.totalEmCentavos,
    itens: pedido.itens.map((item) => ({
      nome: item.nomeProduto,
      quantidade: item.quantidade,
      precoUnitarioEmCentavos: item.precoUnitarioEmCentavos,
      totalEmCentavos: item.totalEmCentavos,
    })),
  };
}
