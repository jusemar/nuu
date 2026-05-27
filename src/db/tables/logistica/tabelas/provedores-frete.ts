import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const provedoresFreteTable = pgTable(
  "provedores_frete",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identificador: text("identificador").notNull(),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("provedores_frete_identificador_unique").on(
      table.identificador,
    ),
  ],
);
