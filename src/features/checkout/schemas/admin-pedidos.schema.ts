import { z } from "zod";

import {
  PAGAMENTO_METODOS_CHECKOUT,
  PAGAMENTO_STATUS_CHECKOUT,
  PEDIDO_STATUS_CHECKOUT,
} from "../constants/pedidos-pagamentos";

function limparTextoFiltro(valor: unknown) {
  if (typeof valor !== "string") {
    return undefined;
  }

  const texto = valor.trim();

  return texto.length > 0 ? texto : undefined;
}

function normalizarTextoOpcional(valor: unknown) {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto.length > 0 ? texto : null;
}

export const filtrosPedidosAdminSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  statusPedido: z.enum(PEDIDO_STATUS_CHECKOUT).optional().catch(undefined),
  statusPagamento: z
    .enum(PAGAMENTO_STATUS_CHECKOUT)
    .optional()
    .catch(undefined),
  metodoPagamento: z
    .enum(PAGAMENTO_METODOS_CHECKOUT)
    .optional()
    .catch(undefined),
  numeroPedido: z.preprocess(limparTextoFiltro, z.string().optional()),
  emailCliente: z.preprocess(limparTextoFiltro, z.string().optional()),
});

export const alterarStatusPedidoAdminSchema = z.object({
  pedidoId: z.uuid("Pedido inválido."),
  status: z.enum(
    [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "canceled",
      "refunded",
      "expired",
    ],
    "Status inválido para alteração manual.",
  ),
});

export const salvarLogisticaPedidoAdminSchema = z.object({
  pedidoId: z.uuid("Pedido inválido."),
  transportadora: z.preprocess(
    normalizarTextoOpcional,
    z.string().max(120).nullable(),
  ),
  codigoRastreio: z.preprocess(
    normalizarTextoOpcional,
    z.string().max(120).nullable(),
  ),
});

export const acaoLogisticaPedidoAdminSchema = z.object({
  pedidoId: z.uuid("Pedido inválido."),
});

export type FiltrosPedidosAdmin = z.infer<typeof filtrosPedidosAdminSchema>;
export type AlterarStatusPedidoAdmin = z.infer<
  typeof alterarStatusPedidoAdminSchema
>;
export type SalvarLogisticaPedidoAdmin = z.infer<
  typeof salvarLogisticaPedidoAdminSchema
>;
