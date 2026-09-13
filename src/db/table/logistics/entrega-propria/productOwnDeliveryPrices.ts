import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { productTable } from "../../products/products";
import { cities } from "../cities/cities";
import { bairrosEntregaPropria } from "./bairrosEntregaPropria";
import {
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegions,
} from "./shippingRegions";

export const productOwnDeliveryPrices = pgTable(
  "product_own_delivery_prices",
  {
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
    /** Bairro canônico. Substitui a distinção ambígua entre regional e avulso. */
    bairroId: integer("bairro_id").references(() => bairrosEntregaPropria.id, {
      onDelete: "restrict",
    }),
    cepEspecificoId: integer("cep_especifico_id").references(
      () => cepsEspecificos.id,
      { onDelete: "cascade" },
    ),
    /** Regra de preço para uma cidade já coberta pela logística. */
    cityId: integer("city_id").references(() => cities.id, {
      onDelete: "cascade",
    }),
    shippingPrice: integer("shipping_price").notNull(),
    /** Permite representar destinos que oferecem apenas a modalidade programada. */
    rapidDeliveryActive: boolean("rapid_delivery_active")
      .default(true)
      .notNull(),
    deliveryDeadline: text("delivery_deadline"),
    /** Configuração opcional da entrega consolidada no mesmo destino. */
    scheduledDeliveryActive: boolean("scheduled_delivery_active")
      .default(false)
      .notNull(),
    scheduledDeliveryMinDays: integer("scheduled_delivery_min_days"),
    scheduledDeliveryPrice: integer("scheduled_delivery_price"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_own_delivery_prices_product_region_uidx")
      .on(table.productId, table.regionId)
      .where(sql`${table.destinationType} = 'region'`),
    uniqueIndex("product_own_delivery_prices_product_bairro_uidx")
      .on(table.productId, table.bairroId)
      .where(sql`${table.destinationType} IN ('bairro', 'bairro-avulso')`),
    uniqueIndex("product_own_delivery_prices_product_cep_uidx")
      .on(table.productId, table.cepEspecificoId)
      .where(sql`${table.destinationType} = 'cep-especifico'`),
    uniqueIndex("product_own_delivery_prices_product_cidade_uidx")
      .on(table.productId, table.cityId)
      .where(sql`${table.destinationType} = 'cidade'`),
    check(
      "product_own_delivery_prices_destino_check",
      sql`(${table.destinationType} = 'region' AND ${table.regionId} IS NOT NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} IN ('bairro', 'bairro-avulso') AND ${table.regionId} IS NULL AND ${table.bairroId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} = 'cep-especifico' AND ${table.regionId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NOT NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} = 'cidade' AND ${table.regionId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NOT NULL)`,
    ),
    check(
      "product_own_delivery_prices_valores_check",
      sql`${table.shippingPrice} >= 0 AND (${table.scheduledDeliveryPrice} IS NULL OR ${table.scheduledDeliveryPrice} >= 0) AND (${table.scheduledDeliveryMinDays} IS NULL OR ${table.scheduledDeliveryMinDays} >= 0) AND (NOT ${table.scheduledDeliveryActive} OR (${table.scheduledDeliveryPrice} IS NOT NULL AND ${table.scheduledDeliveryMinDays} IS NOT NULL))`,
    ),
  ],
);

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
    bairro: one(bairrosEntregaPropria, {
      fields: [productOwnDeliveryPrices.bairroId],
      references: [bairrosEntregaPropria.id],
    }),
    cepEspecifico: one(cepsEspecificos, {
      fields: [productOwnDeliveryPrices.cepEspecificoId],
      references: [cepsEspecificos.id],
    }),
    cidade: one(cities, {
      fields: [productOwnDeliveryPrices.cityId],
      references: [cities.id],
    }),
  }),
);

export type ProductOwnDeliveryPrice =
  typeof productOwnDeliveryPrices.$inferSelect;
export type NewProductOwnDeliveryPrice =
  typeof productOwnDeliveryPrices.$inferInsert;
