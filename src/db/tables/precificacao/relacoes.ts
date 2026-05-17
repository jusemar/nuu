import { relations } from "drizzle-orm";

import { categoryTable } from "../../table/categories/categories";
import { productTable } from "../../table/products/products";
import { configuracoesPagamentoTable } from "./tabelas/configuracoes-pagamento";
import { regrasPromocionaisTable } from "./tabelas/regras-promocionais";

export const configuracoesPagamentoRelations = relations(
  configuracoesPagamentoTable,
  () => ({}),
);

export const regrasPromocionaisRelations = relations(
  regrasPromocionaisTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [regrasPromocionaisTable.produtoId],
      references: [productTable.id],
    }),
    categoria: one(categoryTable, {
      fields: [regrasPromocionaisTable.categoriaId],
      references: [categoryTable.id],
    }),
  }),
);
