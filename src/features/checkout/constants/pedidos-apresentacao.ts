import type {
  PagamentoGatewayCheckout,
  PagamentoMetodoCheckout,
  PagamentoStatusCheckout,
  PedidoHistoricoOrigemCheckout,
  PedidoHistoricoTipoCheckout,
  PedidoStatusCheckout,
} from "../types/pedidos-pagamentos.types";

export const PEDIDO_STATUS_LABEL: Record<PedidoStatusCheckout, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
  expired: "Expirado",
};

export const PEDIDO_HISTORICO_TIPO_LABEL: Record<
  PedidoHistoricoTipoCheckout,
  string
> = {
  pedido_criado: "Pedido criado",
  pagamento_aprovado: "Pagamento aprovado",
  status_alterado_manual: "Status alterado",
  pedido_enviado: "Pedido enviado",
  rastreio_atualizado: "Rastreio atualizado",
  pedido_entregue: "Pedido entregue",
};

export const PEDIDO_HISTORICO_ORIGEM_LABEL: Record<
  PedidoHistoricoOrigemCheckout,
  string
> = {
  system: "Sistema",
  admin: "Admin",
};

export const PAGAMENTO_STATUS_LABEL: Record<PagamentoStatusCheckout, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  expired: "Expirado",
};

export const PAGAMENTO_METODO_LABEL: Record<PagamentoMetodoCheckout, string> = {
  cartao: "Cartao",
  pix: "PIX",
};

export const PAGAMENTO_GATEWAY_LABEL: Record<PagamentoGatewayCheckout, string> =
  {
    stripe: "Stripe",
    efibank: "Efí",
  };
