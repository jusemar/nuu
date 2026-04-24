import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index
} from "drizzle-orm/pg-core";

export const modalidadesRetiradaTable = pgTable("modalidades_retirada", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  slug: text().notNull().unique(),
  ativo: boolean().default(true).notNull(),
  config: jsonb(),
  mensagemPadrao: text("mensagem_padrao"),
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("modalidades_retirada_slug_idx").on(table.slug),
}));