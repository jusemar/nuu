import { relations } from "drizzle-orm";

import { categoryTable } from "../../table/categories/categories";
import { marcaTable } from "../../table/marcas/marcas";
import { productTable } from "../../table/products/products";
import { cuponsPromocaoTable } from "./tabelas/cupons-promocao";
import { regrasPromocaoCategoriasTable } from "./tabelas/regras-promocao-categorias";
import { regrasPromocaoFretesGratisTable } from "./tabelas/regras-promocao-fretes-gratis";
import { regrasPromocaoMarcasTable } from "./tabelas/regras-promocao-marcas";
import { regrasPromocaoProdutosTable } from "./tabelas/regras-promocao-produtos";
import { regrasPromocaoSubtotaisTable } from "./tabelas/regras-promocao-subtotais";
import { regrasPromocaoTable } from "./tabelas/regras-promocao";
import { usosCuponsPromocaoTable } from "./tabelas/usos-cupons-promocao";

export const regrasPromocaoRelations = relations(
  regrasPromocaoTable,
  ({ many }) => ({
    produtos: many(regrasPromocaoProdutosTable),
    categorias: many(regrasPromocaoCategoriasTable),
    marcas: many(regrasPromocaoMarcasTable),
    subtotais: many(regrasPromocaoSubtotaisTable),
    fretesGratis: many(regrasPromocaoFretesGratisTable),
  }),
);

export const regrasPromocaoProdutosRelations = relations(
  regrasPromocaoProdutosTable,
  ({ one }) => ({
    regraPromocao: one(regrasPromocaoTable, {
      fields: [regrasPromocaoProdutosTable.regraPromocaoId],
      references: [regrasPromocaoTable.id],
    }),
    produto: one(productTable, {
      fields: [regrasPromocaoProdutosTable.produtoId],
      references: [productTable.id],
    }),
  }),
);

export const regrasPromocaoCategoriasRelations = relations(
  regrasPromocaoCategoriasTable,
  ({ one }) => ({
    regraPromocao: one(regrasPromocaoTable, {
      fields: [regrasPromocaoCategoriasTable.regraPromocaoId],
      references: [regrasPromocaoTable.id],
    }),
    categoria: one(categoryTable, {
      fields: [regrasPromocaoCategoriasTable.categoriaId],
      references: [categoryTable.id],
    }),
  }),
);

export const regrasPromocaoMarcasRelations = relations(
  regrasPromocaoMarcasTable,
  ({ one }) => ({
    regraPromocao: one(regrasPromocaoTable, {
      fields: [regrasPromocaoMarcasTable.regraPromocaoId],
      references: [regrasPromocaoTable.id],
    }),
    marca: one(marcaTable, {
      fields: [regrasPromocaoMarcasTable.marcaId],
      references: [marcaTable.id],
    }),
  }),
);

export const regrasPromocaoSubtotaisRelations = relations(
  regrasPromocaoSubtotaisTable,
  ({ one }) => ({
    regraPromocao: one(regrasPromocaoTable, {
      fields: [regrasPromocaoSubtotaisTable.regraPromocaoId],
      references: [regrasPromocaoTable.id],
    }),
  }),
);

export const regrasPromocaoFretesGratisRelations = relations(
  regrasPromocaoFretesGratisTable,
  ({ one }) => ({
    regraPromocao: one(regrasPromocaoTable, {
      fields: [regrasPromocaoFretesGratisTable.regraPromocaoId],
      references: [regrasPromocaoTable.id],
    }),
  }),
);

export const cuponsPromocaoRelations = relations(
  cuponsPromocaoTable,
  ({ many }) => ({
    usos: many(usosCuponsPromocaoTable),
  }),
);

export const usosCuponsPromocaoRelations = relations(
  usosCuponsPromocaoTable,
  ({ one }) => ({
    cupomPromocao: one(cuponsPromocaoTable, {
      fields: [usosCuponsPromocaoTable.cupomPromocaoId],
      references: [cuponsPromocaoTable.id],
    }),
  }),
);
