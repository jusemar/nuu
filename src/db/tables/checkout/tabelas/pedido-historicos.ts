import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  checkoutPedidoHistoricoOrigemEnum,
  checkoutPedidoHistoricoTipoEnum,
  checkoutPedidoStatusEnum,
} from "../enums";
import { checkoutPedidosTable } from "./pedidos";

export const checkoutPedidoHistoricosTable = pgTable(
  "checkout_pedido_historicos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    tipo: checkoutPedidoHistoricoTipoEnum("tipo").notNull(),
    descricao: text("descricao").notNull(),
    origem: checkoutPedidoHistoricoOrigemEnum("origem").notNull(),
    statusAnterior: checkoutPedidoStatusEnum("status_anterior"),
    statusNovo: checkoutPedidoStatusEnum("status_novo"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_pedido_historicos_pedido_id_idx").on(table.pedidoId),
    index("checkout_pedido_historicos_tipo_idx").on(table.tipo),
    index("checkout_pedido_historicos_created_at_idx").on(table.createdAt),
  ],
);
