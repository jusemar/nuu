// src/db/table/products/variant-images.ts
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { productVariantTable } from './product-variants';

export const productVariantImageTable = pgTable("product_variant_image", {
  id: uuid().primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});