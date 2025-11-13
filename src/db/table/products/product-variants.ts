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
  
  // Status e controle
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Variante principal
  
  // Imagem específica da variante
  imageUrl: text("image_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});