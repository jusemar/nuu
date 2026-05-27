import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const tiposLogisticosTable = pgTable(
  "tipos_logisticos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identificador: text("identificador").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tipos_logisticos_identificador_unique").on(
      table.identificador,
    ),
  ],
);
