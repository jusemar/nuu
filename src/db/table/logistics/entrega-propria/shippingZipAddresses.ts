import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const shippingZipAddresses = pgTable(
  "shipping_zip_addresses",
  {
    id: serial("id").primaryKey(),
    cep: varchar("cep", { length: 8 }).notNull(),
    street: text("street").default("").notNull(),
    complement: text("complement"),
    neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    ibgeCode: varchar("ibge_code", { length: 20 }),
    source: varchar("source", { length: 40 }).default("external").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  },
  (table) => ({
    cepUnique: uniqueIndex("shipping_zip_addresses_cep_idx").on(table.cep),
    cityStateIndex: index("shipping_zip_addresses_city_state_idx").on(
      table.state,
      table.city,
    ),
    neighborhoodIndex: index("shipping_zip_addresses_neighborhood_idx").on(
      table.neighborhood,
    ),
  }),
);

export const shippingZipAddressesRelations = relations(
  shippingZipAddresses,
  () => ({}),
);

export type ShippingZipAddress = typeof shippingZipAddresses.$inferSelect;
export type NewShippingZipAddress = typeof shippingZipAddresses.$inferInsert;
