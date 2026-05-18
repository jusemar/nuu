import type {
  PagamentoGatewayCheckout,
  PagamentoMetodoCheckout,
  PagamentoStatusCheckout,
  PedidoStatusCheckout,
} from "../types/pedidos-pagamentos.types";

export const PEDIDO_STATUS_CHECKOUT: PedidoStatusCheckout[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "expired",
];

export const PAGAMENTO_STATUS_CHECKOUT: PagamentoStatusCheckout[] = [
  "pending",
  "paid",
  "failed",
  "expired",
];

export const PAGAMENTO_GATEWAYS_CHECKOUT: PagamentoGatewayCheckout[] = [
  "stripe",
  "efibank",
];

export const PAGAMENTO_METODOS_CHECKOUT: PagamentoMetodoCheckout[] = [
  "cartao",
  "pix",
];

export const PREFIXO_NUMERO_PEDIDO = "#";
