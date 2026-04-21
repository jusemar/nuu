/**
 * SCHEMA PRODUCT SUPPLIERS - Tabela de junção
 * 
 * Relaciona produtos com fornecedores que podem entregá-los.
 * Um produto pode ter vários fornecedores, um fornecedor pode ter vários produtos.
 * 
 * Exemplo: Produto A pode ser entregue pela Loja Própria ou Fornecedor Silva
 */

import { pgTable, integer, uuid, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { productTable } from "../../products/products";
import { suppliers } from "../suppliers/suppliers";

/**
 * Estrutura de regras específicas do fornecedor para este produto
 */
export interface SupplierProductRules {
  /** Preço específico do frete para este produto */
  customShippingPrice?: number;
  
  /** Prazo adicional em dias */
  additionalDays?: number;
  
  /** Se fornecedor tem prioridade sobre outros */
  isPriority?: boolean;
  
  /** Quantidade mínima para pedido */
  minOrderQuantity?: number;
}

/**
 * Tabela de junção: Produto ↔ Fornecedor
 */
export const productSuppliersTable = pgTable("product_suppliers", {
  /** ID único */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  /** ID do produto (foreign key) */
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  
  /** ID do fornecedor (foreign key) */
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  
  /** Se este fornecedor está ativo para este produto */
  isActive: boolean("is_active").default(true).notNull(),
  
  /** Regras específicas (JSONB) */
  rules: jsonb("rules").$type<SupplierProductRules>().default({}),
  
  /** Quando foi criado */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Tipos inferidos do Drizzle */
export type ProductSupplier = typeof productSuppliersTable.$inferSelect;
export type NewProductSupplier = typeof productSuppliersTable.$inferInsert;