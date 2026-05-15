import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  checkoutPagamentoGatewayEnum,
  checkoutPagamentoMetodoEnum,
  checkoutPagamentoStatusEnum,
} from "../enums";
import { checkoutPedidosTable } from "./pedidos";

export const checkoutPagamentosTable = pgTable(
  "checkout_pagamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    gateway: checkoutPagamentoGatewayEnum("gateway").notNull(),
    metodo: checkoutPagamentoMetodoEnum("metodo").notNull(),
    status: checkoutPagamentoStatusEnum("status").notNull().default("pending"),
    valorEmCentavos: integer("valor_em_centavos").notNull(),
    transactionId: text("transaction_id"),
    pixTxid: text("pix_txid"),
    qrCode: text("qr_code"),
    copiaECola: text("copia_e_cola"),
    providerResponse: jsonb("provider_response"),
    expiresAt: timestamp("expires_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_pagamentos_pedido_id_idx").on(table.pedidoId),
    index("checkout_pagamentos_transaction_id_idx").on(table.transactionId),
    index("checkout_pagamentos_pix_txid_idx").on(table.pixTxid),
  ],
);
