import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../../table/products/products";
import { promocaoTipoDescontoEnum } from "../enums";
import { regrasPromocaoTable } from "./regras-promocao";

export const regrasPromocaoProdutosTable = pgTable(
  "regras_promocao_produtos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regraPromocaoId: uuid("regra_promocao_id")
      .notNull()
      .references(() => regrasPromocaoTable.id, { onDelete: "cascade" }),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    modalidade: text("modalidade"),
    tipoDesconto: promocaoTipoDescontoEnum("tipo_desconto").notNull(),
    valorDesconto: integer("valor_desconto").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    index("regras_promocao_produtos_regra_promocao_id_idx").on(
      table.regraPromocaoId,
    ),
    index("regras_promocao_produtos_produto_id_idx").on(table.produtoId),
    index("regras_promocao_produtos_modalidade_idx").on(table.modalidade),
  ],
);

export type RegraPromocaoProduto =
  typeof regrasPromocaoProdutosTable.$inferSelect;
export type NovaRegraPromocaoProduto =
  typeof regrasPromocaoProdutosTable.$inferInsert;
