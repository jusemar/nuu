import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../../table/products/products";
import { tiposLogisticosTable } from "./tipos-logisticos";

export const produtosTiposLogisticosTable = pgTable(
  "produtos_tipos_logisticos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    tipoLogisticoId: uuid("tipo_logistico_id")
      .notNull()
      .references(() => tiposLogisticosTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("produtos_tipos_logisticos_produto_tipo_unique").on(
      table.produtoId,
      table.tipoLogisticoId,
    ),
    index("produtos_tipos_logisticos_produto_id_idx").on(table.produtoId),
    index("produtos_tipos_logisticos_tipo_logistico_id_idx").on(
      table.tipoLogisticoId,
    ),
  ],
);
