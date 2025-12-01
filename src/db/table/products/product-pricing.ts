// src/db/table/products/product-pricing.ts
import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { productTable } from './products';

export const productPricingTable = pgTable("product_pricing", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'stock', 'pre_sale', 'dropshipping', 'order_basis'
  pricingModalDescription: text("pricing_modal_description"),
  price: integer("price_in_cents").notNull(),
  mainCardPrice: boolean("main_card_price").default(false),
  deliveryDays: text("delivery_days"),
  hasPromo: boolean("has_promo").default(false),
  promoType: text("promo_type"), // 'normal', 'flash'
  promoPrice: integer("promo_price_in_cents"),
  promoEndDate: timestamp("promo_end_date"),
  promoDuration: integer("promo_duration"),
  promoDurationUnit: text("promo_duration_unit"), // 'days', 'hours'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});