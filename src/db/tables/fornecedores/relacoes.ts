import { relations } from "drizzle-orm";

import { productTable } from "../../table/products/products";
import { fornecedorProdutoVinculosTable } from "./tabelas/fornecedor-produto-vinculos";
import { fornecedorProdutosStagingTable } from "./tabelas/fornecedor-produtos-staging";
import { fornecedoresTable } from "./tabelas/fornecedores";
import { importacaoFornecedorAjustesTable } from "./tabelas/importacao-fornecedor-ajustes";
import { importacoesFornecedorTable } from "./tabelas/importacoes-fornecedor";

export const fornecedoresRelations = relations(
  fornecedoresTable,
  ({ many }) => ({
    importacoes: many(importacoesFornecedorTable),
    vinculosProdutos: many(fornecedorProdutoVinculosTable),
  }),
);

export const importacoesFornecedorRelations = relations(
  importacoesFornecedorTable,
  ({ many, one }) => ({
    fornecedor: one(fornecedoresTable, {
      fields: [importacoesFornecedorTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
    produtosStaging: many(fornecedorProdutosStagingTable),
    ajustesPreco: many(importacaoFornecedorAjustesTable),
  }),
);

export const fornecedorProdutosStagingRelations = relations(
  fornecedorProdutosStagingTable,
  ({ one }) => ({
    importacao: one(importacoesFornecedorTable, {
      fields: [fornecedorProdutosStagingTable.importacaoId],
      references: [importacoesFornecedorTable.id],
    }),
    produtoLocalizado: one(productTable, {
      fields: [fornecedorProdutosStagingTable.produtoLocalizadoId],
      references: [productTable.id],
    }),
  }),
);

export const fornecedorProdutoVinculosRelations = relations(
  fornecedorProdutoVinculosTable,
  ({ one }) => ({
    fornecedor: one(fornecedoresTable, {
      fields: [fornecedorProdutoVinculosTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
    produto: one(productTable, {
      fields: [fornecedorProdutoVinculosTable.produtoId],
      references: [productTable.id],
    }),
  }),
);

export const importacaoFornecedorAjustesRelations = relations(
  importacaoFornecedorAjustesTable,
  ({ one }) => ({
    importacao: one(importacoesFornecedorTable, {
      fields: [importacaoFornecedorAjustesTable.importacaoId],
      references: [importacoesFornecedorTable.id],
    }),
    produtoStaging: one(fornecedorProdutosStagingTable, {
      fields: [importacaoFornecedorAjustesTable.produtoStagingId],
      references: [fornecedorProdutosStagingTable.id],
    }),
  }),
);
