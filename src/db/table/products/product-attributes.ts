// src/db/table/products/product-attributes.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { productTable } from './products';

export const productAttributeTable = pgTable("product_attribute", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  name: text().notNull(), // "Cor", "Tamanho", "Tensão"
  values: text("values").array().notNull(), // ["Preto", "Branco"], ["P", "M", "G"]
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});