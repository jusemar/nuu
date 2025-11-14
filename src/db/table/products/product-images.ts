// product-images.ts
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { productVariantTable } from '../products/product-variants';

export const productImageTable = pgTable("product_image", {
  id: uuid().primaryKey().defaultRandom(),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  externalImageId: text("external_image_id"),
  sortOrder: integer("sort_order").notNull(), // Para ordenar as imagens
  altText: text("alt_text"), // Texto alternativo para SEO/acessibilidade
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
