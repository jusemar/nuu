import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { productTable } from './products';

export const productGalleryImagesTable = pgTable("product_gallery_images", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});