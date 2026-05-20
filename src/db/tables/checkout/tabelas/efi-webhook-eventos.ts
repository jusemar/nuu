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

export const checkoutEfiWebhookEventosTable = pgTable(
  "checkout_efi_webhook_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identificadorEvento: text("identificador_evento").notNull(),
    endToEndId: text("end_to_end_id"),
    txid: text("txid"),
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
    uniqueIndex("checkout_efi_webhook_eventos_identificador_unique").on(
      table.identificadorEvento,
    ),
    index("checkout_efi_webhook_eventos_txid_idx").on(table.txid),
    index("checkout_efi_webhook_eventos_end_to_end_id_idx").on(
      table.endToEndId,
    ),
    index("checkout_efi_webhook_eventos_pedido_id_idx").on(table.pedidoId),
    index("checkout_efi_webhook_eventos_pagamento_id_idx").on(
      table.pagamentoId,
    ),
  ],
);
