import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index
} from "drizzle-orm/pg-core";

export const pontosColetaTable = pgTable("pontos_coleta", {
  id: uuid().primaryKey().defaultRandom(),
  nome: text().notNull(),
  slug: text().notNull().unique(),
  endereco: text().notNull(),
  cidade: text().notNull(),
  estado: text().notNull(),
  cep: text().notNull(),
  ativo: boolean().default(true).notNull(),
  herdaHorarioGlobal: boolean("herda_horario_global").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("pontos_coleta_slug_idx").on(table.slug),
  cidadeIdx: index("pontos_coleta_cidade_idx").on(table.cidade),
}));