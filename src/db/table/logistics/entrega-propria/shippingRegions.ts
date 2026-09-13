/**
 * SCHEMA SHIPPING REGIONS - Geografia da Entrega Própria
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * A Entrega Própria usa um único modelo geográfico:
 *   Cidade (`cities`) → Região (`shipping_regions`) → Bairro
 *   (`bairros_entrega_propria`) → CEP específico (`ceps_especificos`).
 *
 * - Dias de entrega e horário de corte: Agenda Geográfica
 *   (`agendas_geograficas_entrega_propria`).
 * - Preços e modalidades: configuração comercial do Produto
 *   (`product_own_delivery_prices`).
 *
 * Precedência para agenda e preço: CEP > Bairro > Região > Cidade.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { cities } from "../cities/cities";

/**
 * REGIÕES DE ENTREGA
 *
 * Agrupam bairros canônicos e faixas de CEP de uma cidade. Não guardam preço
 * nem agenda: esses dados vivem no Produto e na Agenda Geográfica.
 */
export const shippingRegions = pgTable("shipping_regions", {
  id: serial("id").primaryKey(),

  /** Nome da região (ex: "Regional Barreiro") */
  name: varchar("name", { length: 100 }).notNull(),

  /** Descrição opcional da região */
  description: text("description"),

  /** Nome da cidade, usado em buscas por nome e nos bairros pendentes. */
  city: varchar("city", { length: 100 }).notNull(),

  /** Vínculo canônico da cidade (fonte de verdade da hierarquia). */
  cityId: integer("city_id")
    .references(() => cities.id, {
      onDelete: "restrict",
    })
    .notNull(),

  /** Estado (UF) da região */
  state: varchar("state", { length: 2 }).notNull(),

  /** Se a região está ativa para entrega */
  isActive: boolean("is_active").default(true).notNull(),

  /** Data de criação */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** Data de atualização */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * FAIXAS DE CEP DA REGIÃO
 *
 * A região pode ser coberta por bairros vinculados e também por faixas de CEP.
 * As faixas são geradas a partir da base local de CEPs e podem ser ajustadas
 * manualmente pelo admin quando a operação precisar de exceções.
 */
export const shippingRegionCepRanges = pgTable(
  "shipping_region_cep_ranges",
  {
    id: serial("id").primaryKey(),

    regionId: integer("region_id")
      .notNull()
      .references(() => shippingRegions.id, {
        onDelete: "cascade",
      }),

    cepStart: varchar("cep_start", { length: 8 }).notNull(),
    cepEnd: varchar("cep_end", { length: 8 }).notNull(),
    source: varchar("source", { length: 40 }).default("auto").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    regionRangeUnique: uniqueIndex(
      "shipping_region_cep_ranges_region_start_end_idx",
    ).on(table.regionId, table.cepStart, table.cepEnd),
  }),
);

/**
 * CEPs ESPECÍFICOS
 *
 * Nível mais específico da hierarquia geográfica (ex.: um condomínio). Pode
 * receber agenda própria e preço próprio do Produto, sobrescrevendo bairro,
 * região e cidade.
 */
export const cepsEspecificos = pgTable("ceps_especificos", {
  id: serial("id").primaryKey(),

  /** CEP sem hífen (8 dígitos). Exemplo: "30140999" = "30140-999" */
  cep: varchar("cep", { length: 8 }).notNull().unique(),

  /** Bairro onde o CEP está localizado (referência) */
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),

  /** Cidade */
  city: varchar("city", { length: 100 }).notNull(),

  /** Estado */
  state: varchar("state", { length: 2 }).notNull(),

  /** Se está ativo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Data de criação */
  createdAt: timestamp("created_at").defaultNow().notNull(),

  /** Data de atualização */
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * RELAÇÕES ENTRE TABELAS
 */

export const shippingRegionsRelations = relations(
  shippingRegions,
  ({ many }) => ({
    cepRanges: many(shippingRegionCepRanges),
  }),
);

export const shippingRegionCepRangesRelations = relations(
  shippingRegionCepRanges,
  ({ one }) => ({
    region: one(shippingRegions, {
      fields: [shippingRegionCepRanges.regionId],
      references: [shippingRegions.id],
    }),
  }),
);

/**
 * BAIRROS PENDENTES
 *
 * Bairros capturados automaticamente quando um cliente consulta um CEP
 * que possui endereço válido no ViaCEP, mas ainda não possui regra de
 * Entrega Própria cadastrada.
 */
export const shippingPendingNeighborhoods = pgTable(
  "shipping_pending_neighborhoods",
  {
    id: serial("id").primaryKey(),

    /** Último CEP consultado para este bairro */
    lastCep: varchar("last_cep", { length: 8 }).notNull(),

    /** Nome oficial retornado pelo ViaCEP */
    neighborhood: varchar("neighborhood", { length: 100 }).notNull(),

    /** Cidade oficial retornada pelo ViaCEP */
    city: varchar("city", { length: 100 }).notNull(),

    /** UF oficial retornada pelo ViaCEP */
    state: varchar("state", { length: 2 }).notNull(),

    /** Quantidade de consultas sem regra cadastrada */
    consultationCount: integer("consultation_count").default(1).notNull(),

    /** pending | linked | registered | ignored */
    status: varchar("status", { length: 20 }).default("pending").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastConsultedAt: timestamp("last_consulted_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueNeighborhoodCityState: uniqueIndex(
      "shipping_pending_neighborhoods_neighborhood_city_state_idx",
    ).on(table.neighborhood, table.city, table.state),
  }),
);

/**
 * TIPOS INFERIDOS
 */

export type ShippingRegion = typeof shippingRegions.$inferSelect;
export type NewShippingRegion = typeof shippingRegions.$inferInsert;

export type ShippingRegionCepRange =
  typeof shippingRegionCepRanges.$inferSelect;
export type NewShippingRegionCepRange =
  typeof shippingRegionCepRanges.$inferInsert;

export type CepEspecifico = typeof cepsEspecificos.$inferSelect;
export type NewCepEspecifico = typeof cepsEspecificos.$inferInsert;

export type ShippingPendingNeighborhood =
  typeof shippingPendingNeighborhoods.$inferSelect;
export type NewShippingPendingNeighborhood =
  typeof shippingPendingNeighborhoods.$inferInsert;
