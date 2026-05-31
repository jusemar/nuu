import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const marcaTable = pgTable(
  "marca",
  {
    id: uuid().primaryKey().defaultRandom(),
    nome: text().notNull(),
    slug: text().notNull().unique(),
    descricao: text(),
    logoUrl: text("logo_url"),
    ativo: boolean().notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nomeIdx: index("marca_nome_idx").on(table.nome),
    slugIdx: index("marca_slug_idx").on(table.slug),
  }),
);
