import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { grupoNavegacaoLocalEnum } from "../enums";

export const gruposNavegacaoTable = pgTable(
  "grupos_navegacao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    tituloPublico: text("titulo_publico").notNull(),
    identificador: text("identificador").notNull(),
    localExibicao: grupoNavegacaoLocalEnum("local_exibicao")
      .notNull()
      .default("rodape"),
    ativo: boolean("ativo").notNull().default(false),
    ordem: integer("ordem").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    uniqueIndex("grupos_navegacao_identificador_unique").on(
      tabela.identificador,
    ),
    index("grupos_navegacao_local_ordem_idx").on(
      tabela.localExibicao,
      tabela.ordem,
    ),
    index("grupos_navegacao_ativo_idx").on(tabela.ativo),
  ],
);

export type GrupoNavegacao = typeof gruposNavegacaoTable.$inferSelect;
export type NovoGrupoNavegacao = typeof gruposNavegacaoTable.$inferInsert;
