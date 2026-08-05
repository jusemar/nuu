// src/db/table/products/product-variants.ts
import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { productTable } from './products';

export const productVariantTable = pgTable("product_variant", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  
  // Identificação única
  sku: text("sku").notNull().unique(),
  name: text(), // Nome amigável (ex: "Camiseta Preta - P")
  
  // Atributos dinâmicos (cor, tamanho, tensão, etc.)
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  
  // Preços
  priceInCents: integer("price_in_cents").notNull(), // Preço de venda
  comparePriceInCents: integer("compare_price_in_cents"), // Preço original/compare
  costPriceInCents: integer("cost_price_in_cents"), // Preço de custo
  
  // Estoque e logística
  stockQuantity: integer("stock_quantity").notNull().default(0),
  weightInGrams: integer("weight_in_grams"), // Peso individual
  lengthInCm: integer("length_in_cm"), // Dimensões individuais
  widthInCm: integer("width_in_cm"),
  heightInCm: integer("height_in_cm"),
  
  /**
   * Se ESTA variante aceita pagamento na entrega.
   *
   * Nullable e SEM default de propósito. A coluna tem três estados, não dois:
   *   null  → herda a decisão do produto (caso normal)
   *   true  → libera esta variante mesmo que o produto esteja liberado
   *   false → bloqueia SÓ esta variante, ainda que o produto aceite
   *
   * É o mesmo idioma já usado em `weightInGrams` e nas classificações logísticas:
   * `null` significa "não decidido aqui, pergunte ao produto". Um default `false`
   * destruiria isso — toda variante nasceria bloqueando o produto.
   */
  aceitaPagamentoNaEntrega: boolean("aceita_pagamento_na_entrega"),

  // Status e controle
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Variante principal
  
  // Imagem específica da variante
  imageUrl: text("image_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});