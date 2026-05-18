import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutPedidosTable } from "./pedidos";

export const checkoutPedidoLogisticasTable = pgTable(
  "checkout_pedido_logisticas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    transportadora: text("transportadora"),
    codigoRastreio: text("codigo_rastreio"),
    dataEnvio: timestamp("data_envio"),
    dataEntrega: timestamp("data_entrega"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_pedido_logisticas_pedido_id_unique").on(
      table.pedidoId,
    ),
    index("checkout_pedido_logisticas_codigo_rastreio_idx").on(
      table.codigoRastreio,
    ),
  ],
);
