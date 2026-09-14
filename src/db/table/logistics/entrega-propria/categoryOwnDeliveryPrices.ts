import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { categoryTable } from "../../categories/categories";
import { cities } from "../cities/cities";
import { bairrosEntregaPropria } from "./bairrosEntregaPropria";
import { cepsEspecificos, shippingRegions } from "./shippingRegions";

/**
 * Condições comerciais PADRÃO da Entrega Própria de uma categoria, por destino.
 *
 * Espelha `product_own_delivery_prices` de propósito: o mesmo motor calcula as
 * duas fontes. Precedência comercial: Produto > Categoria direta > Categoria
 * ancestral mais próxima. Dias e horário de corte NUNCA ficam aqui: vêm da
 * Agenda Geográfica.
 */
export const categoryOwnDeliveryPrices = pgTable(
  "category_own_delivery_prices",
  {
    id: serial("id").primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    /** Nível do destino; espelha a hierarquia CEP > Bairro > Região > Cidade. */
    destinationType: varchar("destination_type", { length: 20 })
      .$type<"region" | "bairro" | "cep-especifico" | "cidade">()
      .notNull(),
    regionId: integer("region_id").references(() => shippingRegions.id, {
      onDelete: "cascade",
    }),
    bairroId: integer("bairro_id").references(() => bairrosEntregaPropria.id, {
      onDelete: "restrict",
    }),
    cepEspecificoId: integer("cep_especifico_id").references(
      () => cepsEspecificos.id,
      { onDelete: "cascade" },
    ),
    cityId: integer("city_id").references(() => cities.id, {
      onDelete: "cascade",
    }),
    shippingPrice: integer("shipping_price").notNull(),
    rapidDeliveryActive: boolean("rapid_delivery_active")
      .default(true)
      .notNull(),
    deliveryDeadline: text("delivery_deadline"),
    scheduledDeliveryActive: boolean("scheduled_delivery_active")
      .default(false)
      .notNull(),
    /** Janelas (próximas datas válidas da agenda) após a entrega rápida. */
    scheduledDeliveryMinDays: integer("scheduled_delivery_min_days"),
    /** 0 = programada grátis. */
    scheduledDeliveryPrice: integer("scheduled_delivery_price"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("category_own_delivery_prices_category_idx").on(table.categoryId),
    uniqueIndex("category_own_delivery_prices_category_region_uidx")
      .on(table.categoryId, table.regionId)
      .where(sql`${table.destinationType} = 'region'`),
    uniqueIndex("category_own_delivery_prices_category_bairro_uidx")
      .on(table.categoryId, table.bairroId)
      .where(sql`${table.destinationType} = 'bairro'`),
    uniqueIndex("category_own_delivery_prices_category_cep_uidx")
      .on(table.categoryId, table.cepEspecificoId)
      .where(sql`${table.destinationType} = 'cep-especifico'`),
    uniqueIndex("category_own_delivery_prices_category_cidade_uidx")
      .on(table.categoryId, table.cityId)
      .where(sql`${table.destinationType} = 'cidade'`),
    check(
      "category_own_delivery_prices_destino_check",
      sql`(${table.destinationType} = 'region' AND ${table.regionId} IS NOT NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} = 'bairro' AND ${table.regionId} IS NULL AND ${table.bairroId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} = 'cep-especifico' AND ${table.regionId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NOT NULL AND ${table.cityId} IS NULL) OR (${table.destinationType} = 'cidade' AND ${table.regionId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL AND ${table.cityId} IS NOT NULL)`,
    ),
    check(
      "category_own_delivery_prices_valores_check",
      sql`${table.shippingPrice} >= 0 AND (${table.scheduledDeliveryPrice} IS NULL OR ${table.scheduledDeliveryPrice} >= 0) AND (${table.scheduledDeliveryMinDays} IS NULL OR ${table.scheduledDeliveryMinDays} >= 0) AND (NOT ${table.scheduledDeliveryActive} OR (${table.scheduledDeliveryPrice} IS NOT NULL AND ${table.scheduledDeliveryMinDays} IS NOT NULL))`,
    ),
  ],
);

export const categoryOwnDeliveryPricesRelations = relations(
  categoryOwnDeliveryPrices,
  ({ one }) => ({
    category: one(categoryTable, {
      fields: [categoryOwnDeliveryPrices.categoryId],
      references: [categoryTable.id],
    }),
    region: one(shippingRegions, {
      fields: [categoryOwnDeliveryPrices.regionId],
      references: [shippingRegions.id],
    }),
    bairro: one(bairrosEntregaPropria, {
      fields: [categoryOwnDeliveryPrices.bairroId],
      references: [bairrosEntregaPropria.id],
    }),
    cepEspecifico: one(cepsEspecificos, {
      fields: [categoryOwnDeliveryPrices.cepEspecificoId],
      references: [cepsEspecificos.id],
    }),
    cidade: one(cities, {
      fields: [categoryOwnDeliveryPrices.cityId],
      references: [cities.id],
    }),
  }),
);

export type CategoryOwnDeliveryPrice =
  typeof categoryOwnDeliveryPrices.$inferSelect;
export type NewCategoryOwnDeliveryPrice =
  typeof categoryOwnDeliveryPrices.$inferInsert;
