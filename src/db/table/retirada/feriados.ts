import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  index
} from "drizzle-orm/pg-core";

export const feriadosTable = pgTable("feriados", {
  id: uuid().primaryKey().defaultRandom(),
  data: date().notNull(),
  descricao: text().notNull(),
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  dataIdx: index("feriados_data_idx").on(table.data),
}));