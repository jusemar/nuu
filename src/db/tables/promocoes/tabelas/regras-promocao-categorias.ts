import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { categoryTable } from "../../../table/categories/categories";
import { promocaoTipoDescontoEnum } from "../enums";
import { regrasPromocaoTable } from "./regras-promocao";

export const regrasPromocaoCategoriasTable = pgTable(
  "regras_promocao_categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regraPromocaoId: uuid("regra_promocao_id")
      .notNull()
      .references(() => regrasPromocaoTable.id, { onDelete: "cascade" }),
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    valorDesconto: integer("valor_desconto").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("regras_promocao_categorias_regra_categoria_unique").on(
      table.regraPromocaoId,
      table.categoriaId,
    ),
    index("regras_promocao_categorias_regra_promocao_id_idx").on(
      table.regraPromocaoId,
    ),
    index("regras_promocao_categorias_categoria_id_idx").on(table.categoriaId),
  ],
);

export type RegraPromocaoCategoria =
  typeof regrasPromocaoCategoriasTable.$inferSelect;
export type NovaRegraPromocaoCategoria =
  typeof regrasPromocaoCategoriasTable.$inferInsert;
