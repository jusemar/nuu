import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productVariantTable } from "../../../table/products/product-variants";
import { tiposLogisticosTable } from "./tipos-logisticos";

export const variantesTiposLogisticosTable = pgTable(
  "variantes_tipos_logisticos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    varianteId: uuid("variante_id")
      .notNull()
      .references(() => productVariantTable.id, { onDelete: "cascade" }),
    tipoLogisticoId: uuid("tipo_logistico_id")
      .notNull()
      .references(() => tiposLogisticosTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("variantes_tipos_logisticos_variante_tipo_unique").on(
      tabela.varianteId,
      tabela.tipoLogisticoId,
    ),
    index("variantes_tipos_logisticos_variante_id_idx").on(tabela.varianteId),
    index("variantes_tipos_logisticos_tipo_logistico_id_idx").on(
      tabela.tipoLogisticoId,
    ),
  ],
);
