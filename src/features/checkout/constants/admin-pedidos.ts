import type { PedidoStatusCheckout } from "../types/pedidos-pagamentos.types";

export {
  PAGAMENTO_GATEWAY_LABEL,
  PAGAMENTO_METODO_LABEL,
  PAGAMENTO_STATUS_LABEL,
  PEDIDO_HISTORICO_ORIGEM_LABEL,
  PEDIDO_HISTORICO_TIPO_LABEL,
  PEDIDO_STATUS_LABEL,
} from "./pedidos-apresentacao";

export const PEDIDOS_ADMIN_PAGE_SIZE = 10;

export const PEDIDO_STATUS_MANUAL_ADMIN: PedidoStatusCheckout[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "expired",
];
