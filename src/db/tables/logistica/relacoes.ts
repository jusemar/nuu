import { relations } from "drizzle-orm";

import { categoryTable } from "../../table/categories/categories";
import { productTable } from "../../table/products/products";
import { productVariantTable } from "../../table/products/product-variants";
import { produtosTiposLogisticosTable } from "./tabelas/produtos-tipos-logisticos";
import { provedoresFreteTable } from "./tabelas/provedores-frete";
import { regrasCategoriasFreteTable } from "./tabelas/regras-categorias-frete";
import { regrasProdutosFreteTable } from "./tabelas/regras-produtos-frete";
import { regrasTiposLogisticosFreteTable } from "./tabelas/regras-tipos-logisticos-frete";
import { servicosFreteTable } from "./tabelas/servicos-frete";
import { tiposLogisticosTable } from "./tabelas/tipos-logisticos";
import { transportadorasFreteTable } from "./tabelas/transportadoras-frete";
import { variantesTiposLogisticosTable } from "./tabelas/variantes-tipos-logisticos";

export const provedoresFreteRelations = relations(
  provedoresFreteTable,
  ({ many }) => ({
    transportadoras: many(transportadorasFreteTable),
    servicos: many(servicosFreteTable),
    regrasCategorias: many(regrasCategoriasFreteTable),
    regrasProdutos: many(regrasProdutosFreteTable),
    regrasTiposLogisticos: many(regrasTiposLogisticosFreteTable),
  }),
);

export const transportadorasFreteRelations = relations(
  transportadorasFreteTable,
  ({ many, one }) => ({
    provedor: one(provedoresFreteTable, {
      fields: [transportadorasFreteTable.provedorFreteId],
      references: [provedoresFreteTable.id],
    }),
    servicos: many(servicosFreteTable),
    regrasCategorias: many(regrasCategoriasFreteTable),
    regrasProdutos: many(regrasProdutosFreteTable),
    regrasTiposLogisticos: many(regrasTiposLogisticosFreteTable),
  }),
);

export const servicosFreteRelations = relations(
  servicosFreteTable,
  ({ many, one }) => ({
    provedor: one(provedoresFreteTable, {
      fields: [servicosFreteTable.provedorFreteId],
      references: [provedoresFreteTable.id],
    }),
    transportadora: one(transportadorasFreteTable, {
      fields: [servicosFreteTable.transportadoraFreteId],
      references: [transportadorasFreteTable.id],
    }),
    regrasCategorias: many(regrasCategoriasFreteTable),
    regrasProdutos: many(regrasProdutosFreteTable),
    regrasTiposLogisticos: many(regrasTiposLogisticosFreteTable),
  }),
);

export const regrasCategoriasFreteRelations = relations(
  regrasCategoriasFreteTable,
  ({ one }) => ({
    categoria: one(categoryTable, {
      fields: [regrasCategoriasFreteTable.categoriaId],
      references: [categoryTable.id],
    }),
    provedor: one(provedoresFreteTable, {
      fields: [regrasCategoriasFreteTable.provedorFreteId],
      references: [provedoresFreteTable.id],
    }),
    transportadora: one(transportadorasFreteTable, {
      fields: [regrasCategoriasFreteTable.transportadoraFreteId],
      references: [transportadorasFreteTable.id],
    }),
    servico: one(servicosFreteTable, {
      fields: [regrasCategoriasFreteTable.servicoFreteId],
      references: [servicosFreteTable.id],
    }),
  }),
);

export const regrasProdutosFreteRelations = relations(
  regrasProdutosFreteTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [regrasProdutosFreteTable.produtoId],
      references: [productTable.id],
    }),
    provedor: one(provedoresFreteTable, {
      fields: [regrasProdutosFreteTable.provedorFreteId],
      references: [provedoresFreteTable.id],
    }),
    transportadora: one(transportadorasFreteTable, {
      fields: [regrasProdutosFreteTable.transportadoraFreteId],
      references: [transportadorasFreteTable.id],
    }),
    servico: one(servicosFreteTable, {
      fields: [regrasProdutosFreteTable.servicoFreteId],
      references: [servicosFreteTable.id],
    }),
  }),
);

export const tiposLogisticosRelations = relations(
  tiposLogisticosTable,
  ({ many }) => ({
    produtos: many(produtosTiposLogisticosTable),
    variantes: many(variantesTiposLogisticosTable),
    regras: many(regrasTiposLogisticosFreteTable),
  }),
);

export const produtosTiposLogisticosRelations = relations(
  produtosTiposLogisticosTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [produtosTiposLogisticosTable.produtoId],
      references: [productTable.id],
    }),
    tipoLogistico: one(tiposLogisticosTable, {
      fields: [produtosTiposLogisticosTable.tipoLogisticoId],
      references: [tiposLogisticosTable.id],
    }),
  }),
);

export const variantesTiposLogisticosRelations = relations(
  variantesTiposLogisticosTable,
  ({ one }) => ({
    variante: one(productVariantTable, {
      fields: [variantesTiposLogisticosTable.varianteId],
      references: [productVariantTable.id],
    }),
    tipoLogistico: one(tiposLogisticosTable, {
      fields: [variantesTiposLogisticosTable.tipoLogisticoId],
      references: [tiposLogisticosTable.id],
    }),
  }),
);

export const regrasTiposLogisticosFreteRelations = relations(
  regrasTiposLogisticosFreteTable,
  ({ one }) => ({
    tipoLogistico: one(tiposLogisticosTable, {
      fields: [regrasTiposLogisticosFreteTable.tipoLogisticoId],
      references: [tiposLogisticosTable.id],
    }),
    provedor: one(provedoresFreteTable, {
      fields: [regrasTiposLogisticosFreteTable.provedorFreteId],
      references: [provedoresFreteTable.id],
    }),
    transportadora: one(transportadorasFreteTable, {
      fields: [regrasTiposLogisticosFreteTable.transportadoraFreteId],
      references: [transportadorasFreteTable.id],
    }),
    servico: one(servicosFreteTable, {
      fields: [regrasTiposLogisticosFreteTable.servicoFreteId],
      references: [servicosFreteTable.id],
    }),
  }),
);
