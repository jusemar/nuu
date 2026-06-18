import { relations } from "drizzle-orm";

import { productTable } from "../../table/products/products";
import { fornecedorIntegracaoLogsTable } from "./tabelas/fornecedor-integracao-logs";
import { fornecedorIntegracoesApiTable } from "./tabelas/fornecedor-integracoes-api";
import { fornecedorMapeamentosColunasTable } from "./tabelas/fornecedor-mapeamentos-colunas";
import { fornecedorProdutosApiStagingTable } from "./tabelas/fornecedor-produtos-api-staging";
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
    mapeamentosColunas: many(fornecedorMapeamentosColunasTable),
    integracoesApi: many(fornecedorIntegracoesApiTable),
  }),
);

export const fornecedorIntegracoesApiRelations = relations(
  fornecedorIntegracoesApiTable,
  ({ many, one }) => ({
    fornecedor: one(fornecedoresTable, {
      fields: [fornecedorIntegracoesApiTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
    logs: many(fornecedorIntegracaoLogsTable),
    produtosApiStaging: many(fornecedorProdutosApiStagingTable),
  }),
);

export const fornecedorIntegracaoLogsRelations = relations(
  fornecedorIntegracaoLogsTable,
  ({ one }) => ({
    integracaoApi: one(fornecedorIntegracoesApiTable, {
      fields: [fornecedorIntegracaoLogsTable.integracaoApiId],
      references: [fornecedorIntegracoesApiTable.id],
    }),
  }),
);

export const fornecedorProdutosApiStagingRelations = relations(
  fornecedorProdutosApiStagingTable,
  ({ one }) => ({
    integracaoApi: one(fornecedorIntegracoesApiTable, {
      fields: [fornecedorProdutosApiStagingTable.integracaoApiId],
      references: [fornecedorIntegracoesApiTable.id],
    }),
  }),
);

export const fornecedorMapeamentosColunasRelations = relations(
  fornecedorMapeamentosColunasTable,
  ({ one }) => ({
    fornecedor: one(fornecedoresTable, {
      fields: [fornecedorMapeamentosColunasTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
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
