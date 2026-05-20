import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { productTable } from "../../products/products";
import {
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegions,
} from "./shippingRegions";

export const productOwnDeliveryPrices = pgTable("product_own_delivery_prices", {
  id: serial("id").primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  destinationType: varchar("destination_type", { length: 20 }).notNull(),
  regionId: integer("region_id").references(() => shippingRegions.id, {
    onDelete: "cascade",
  }),
  bairroAvulsoId: integer("bairro_avulso_id").references(
    () => bairrosAvulsos.id,
    { onDelete: "cascade" },
  ),
  cepEspecificoId: integer("cep_especifico_id").references(
    () => cepsEspecificos.id,
    { onDelete: "cascade" },
  ),
  shippingPrice: integer("shipping_price").notNull(),
  deliveryDeadline: text("delivery_deadline"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productOwnDeliveryPricesRelations = relations(
  productOwnDeliveryPrices,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productOwnDeliveryPrices.productId],
      references: [productTable.id],
    }),
    region: one(shippingRegions, {
      fields: [productOwnDeliveryPrices.regionId],
      references: [shippingRegions.id],
    }),
    bairroAvulso: one(bairrosAvulsos, {
      fields: [productOwnDeliveryPrices.bairroAvulsoId],
      references: [bairrosAvulsos.id],
    }),
    cepEspecifico: one(cepsEspecificos, {
      fields: [productOwnDeliveryPrices.cepEspecificoId],
      references: [cepsEspecificos.id],
    }),
  }),
);

export type ProductOwnDeliveryPrice =
  typeof productOwnDeliveryPrices.$inferSelect;
export type NewProductOwnDeliveryPrice =
  typeof productOwnDeliveryPrices.$inferInsert;
