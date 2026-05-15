import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutPedidoStatusEnum = pgEnum("checkout_pedido_status", [
  "pending",
  "paid",
  "canceled",
  "expired",
]);

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
