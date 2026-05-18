import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutPedidoStatusEnum = pgEnum("checkout_pedido_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "expired",
]);

export const checkoutPedidoHistoricoTipoEnum = pgEnum(
  "checkout_pedido_historico_tipo",
  [
    "pedido_criado",
    "pagamento_aprovado",
    "status_alterado_manual",
    "pedido_enviado",
    "rastreio_atualizado",
    "pedido_entregue",
  ],
);

export const checkoutPedidoHistoricoOrigemEnum = pgEnum(
  "checkout_pedido_historico_origem",
  ["system", "admin"],
);

export const checkoutPagamentoGatewayEnum = pgEnum(
  "checkout_pagamento_gateway",
  ["stripe", "efibank"],
);

export const checkoutPagamentoMetodoEnum = pgEnum("checkout_pagamento_metodo", [
  "cartao",
  "pix",
]);

export const checkoutPagamentoStatusEnum = pgEnum("checkout_pagamento_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);
