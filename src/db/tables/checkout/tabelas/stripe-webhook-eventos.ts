import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutPagamentosTable } from "./pagamentos";
import { checkoutPedidosTable } from "./pedidos";

export const checkoutStripeWebhookEventosTable = pgTable(
  "checkout_stripe_webhook_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripeEventId: text("stripe_event_id").notNull(),
    tipoEvento: text("tipo_evento").notNull(),
    pedidoId: uuid("pedido_id").references(() => checkoutPedidosTable.id, {
      onDelete: "set null",
    }),
    pagamentoId: uuid("pagamento_id").references(
      () => checkoutPagamentosTable.id,
      { onDelete: "set null" },
    ),
    statusProcessamento: text("status_processamento").notNull(),
    erro: text("erro"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_stripe_webhook_eventos_event_id_unique").on(
      table.stripeEventId,
    ),
    index("checkout_stripe_webhook_eventos_pedido_id_idx").on(table.pedidoId),
    index("checkout_stripe_webhook_eventos_pagamento_id_idx").on(
      table.pagamentoId,
    ),
    index("checkout_stripe_webhook_eventos_tipo_idx").on(table.tipoEvento),
  ],
);
