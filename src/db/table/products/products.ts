// src/db/table/products/products.ts
import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { categoryTable } from '../categories/categories';
import { sql } from "drizzle-orm";

export const productTable = pgTable("product", {
  id: uuid().primaryKey().defaultRandom(),
  
  // Básicos
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categoryTable.id, { onDelete: "set null" }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  cardShortText: text("card_short_text"),
  description: text().notNull(),
  brand: text("brand"),
  storeProductFlags: text("store_product_flags").array().default([]),
  
  // Códigos
  sku: text("sku").notNull().default(sql`gen_random_uuid()`), // ← SEM .unique()
  productType: text("product_type"), // 'isbn', 'upc', 'ean'
  productCode: text("product_code"),
  ncmCode: text("ncm_code"),
  
  // Status e organização
  status: text("status").default('draft'), // 'draft', 'published', 'archived'
  collection: text("collection"),
  tags: text("tags").array(), // Array de tags
  
  // Preços
  costPrice: integer("cost_price_in_cents"),
  salePrice: integer("sale_price_in_cents"),
  promoPrice: integer("promo_price_in_cents"),
  taxRate: integer("tax_rate"), // Percentual
  
  // Dimensões e frete
  weight: integer("weight_in_grams"),
  length: integer("length_in_cm"),
  width: integer("width_in_cm"), 
  height: integer("height_in_cm"),
  hasFreeShipping: boolean("has_free_shipping").default(false),
  hasLocalPickup: boolean("has_local_pickup").default(false),
  
  // Garantia
  warrantyPeriod: integer("warranty_period_in_days"),
  warrantyProvider: text("warranty_provider"),
  
  // Vendedor
  sellerCode: text("seller_code"),
  internalCode: text("internal_code"), 
  sellerInfo: text("seller_info"),  
  
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  
  // Controle
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});