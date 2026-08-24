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

import { gruposNavegacaoTable } from "./grupos-navegacao";
import { paginasDinamicasTable } from "./paginas-dinamicas";

export const grupoPaginasTable = pgTable(
  "grupo_paginas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    grupoId: uuid("grupo_id")
      .notNull()
      .references(() => gruposNavegacaoTable.id, { onDelete: "cascade" }),
    paginaId: uuid("pagina_id")
      .notNull()
      .references(() => paginasDinamicasTable.id, { onDelete: "cascade" }),
    textoLink: text("texto_link"),
    ordem: integer("ordem").notNull().default(0),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    uniqueIndex("grupo_paginas_grupo_pagina_unique").on(
      tabela.grupoId,
      tabela.paginaId,
    ),
    index("grupo_paginas_grupo_ordem_idx").on(tabela.grupoId, tabela.ordem),
    index("grupo_paginas_pagina_idx").on(tabela.paginaId),
  ],
);

export type GrupoPagina = typeof grupoPaginasTable.$inferSelect;
export type NovoGrupoPagina = typeof grupoPaginasTable.$inferInsert;
