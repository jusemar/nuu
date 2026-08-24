import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { paginaDinamicaStatusEnum } from "../enums";

/** O conteúdo permanece estruturado e opaco até a escolha do editor/renderizador. */
export const paginasDinamicasTable = pgTable(
  "paginas_dinamicas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titulo: text("titulo").notNull(),
    slug: text("slug").notNull(),
    conteudo: jsonb("conteudo").$type<Record<string, unknown>>().notNull(),
    status: paginaDinamicaStatusEnum("status").notNull().default("rascunho"),
    tituloSeo: text("titulo_seo"),
    descricaoSeo: text("descricao_seo"),
    publicadaEm: timestamp("publicada_em", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    uniqueIndex("paginas_dinamicas_slug_unique").on(tabela.slug),
    index("paginas_dinamicas_status_idx").on(tabela.status),
    index("paginas_dinamicas_updated_at_idx").on(tabela.updatedAt),
  ],
);

export type PaginaDinamica = typeof paginasDinamicasTable.$inferSelect;
export type NovaPaginaDinamica = typeof paginasDinamicasTable.$inferInsert;
