import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  precificacaoAlvoRegraPromocionalEnum,
  precificacaoTipoRegraPromocionalEnum,
} from "../enums";
import { categoryTable } from "../../../table/categories/categories";
import { productTable } from "../../../table/products/products";

export const regrasPromocionaisTable = pgTable(
  "regras_promocionais_precificacao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    prioridade: integer("prioridade").notNull().default(0),
    tipo: precificacaoTipoRegraPromocionalEnum("tipo").notNull(),
    alvo: precificacaoAlvoRegraPromocionalEnum("alvo")
      .notNull()
      .default("global"),
    valorBps: integer("valor_bps"),
    valorEmCentavos: integer("valor_em_centavos"),
    produtoId: uuid("produto_id").references(() => productTable.id, {
      onDelete: "cascade",
    }),
    categoriaId: uuid("categoria_id").references(() => categoryTable.id, {
      onDelete: "cascade",
    }),
    inicioEm: timestamp("inicio_em"),
    fimEm: timestamp("fim_em"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("regras_promocionais_precificacao_ativo_idx").on(table.ativo),
    index("regras_promocionais_precificacao_produto_id_idx").on(
      table.produtoId,
    ),
    index("regras_promocionais_precificacao_categoria_id_idx").on(
      table.categoriaId,
    ),
  ],
);
