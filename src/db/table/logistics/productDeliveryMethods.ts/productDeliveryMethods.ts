/**
 * SCHEMA PRODUCT DELIVERY METHODS - Tabela de junção
 * 
 * Relaciona produtos com modalidades de entrega permitidas.
 * Um produto pode ter várias modalidades, uma modalidade pode ter vários produtos.
 * 
 * Exemplo: Produto A aceita Motoboy e Transportadora
 *          Produto B aceita só Transportadora
 */

import { pgTable, integer, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { productTable } from "../../products/products";
import { deliveryMethods } from "../deliveryMethods/deliveryMethods";

/**
 * Tabela de junção: Produto ↔ Modalidade de Entrega
 */
export const productDeliveryMethodsTable = pgTable("product_delivery_methods", {
  /** ID único */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  /** ID do produto (foreign key) */
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  
  /** ID da modalidade de entrega (foreign key) */
  deliveryMethodId: integer("delivery_method_id")
    .notNull()
    .references(() => deliveryMethods.id, { onDelete: "cascade" }),
  
  /** Se esta modalidade está ativa para este produto */
  isActive: boolean("is_active").default(true).notNull(),
  
  /** Preço específico para este produto (sobrescreve o preço da modalidade) */
  customPrice: integer("custom_price_in_cents"),
  
  /** Quando foi criado */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Tipos inferidos do Drizzle */
export type ProductDeliveryMethod = typeof productDeliveryMethodsTable.$inferSelect;
export type NewProductDeliveryMethod = typeof productDeliveryMethodsTable.$inferInsert;