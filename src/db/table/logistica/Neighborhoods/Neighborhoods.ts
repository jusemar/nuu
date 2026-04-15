/**
 * SCHEMA NEIGHBORHOODS - Banco de dados Drizzle ORM
 * 
 * Define tabela de bairros com faixas de CEP e controle de rotas.
 * Usado apenas para entrega própria (controle total da logística).
 */

import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  serial, 
  integer,
  jsonb 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cities } from '../cities/cities';

/**
 * Estrutura de slot de entrega (armazenado como JSONB)
 */
export interface DeliverySlot {
  id: string;
  dayOfWeek: number;      // 0=Domingo, 6=Sábado
  dayName: string;        // "Segunda-feira"
  startTime: string;      // "08:00"
  endTime: string;        // "13:00"
  price: number;          // em centavos ou decimal
  isActive: boolean;
}

/**
 * Estrutura de faixa de CEP (armazenado como JSONB)
 */
export interface CepRange {
  start: string;          // "01400000" (sem hífen)
  end: string;            // "01599999" (sem hífen)
  display: string;        // "01400-000 a 01599-999" (com hífen para exibir)
}

/**
 * Tabela de bairros
 */
export const neighborhoods = pgTable('neighborhoods', {
  /** ID único */
  id: serial('id').primaryKey(),
  
  /** Nome do bairro */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** ID da cidade (foreign key) */
  cityId: integer('city_id').notNull().references(() => cities.id),
  
  /** Nome da cidade (denormalizado para performance) */
  cityName: varchar('city_name', { length: 100 }).notNull(),
  
  /** UF do estado */
  stateUf: varchar('state_uf', { length: 2 }).notNull(),
  
  /** Faixa de CEP do bairro (JSONB) */
  cepRange: jsonb('cep_range').$type<CepRange>().notNull(),
  
  /** Slots de entrega disponíveis (JSONB array) */
  deliverySlots: jsonb('delivery_slots').$type<DeliverySlot[]>().default([]).notNull(),
  
  /** Se tem algum slot ativo */
  hasActiveSlots: boolean('has_active_slots').default(false).notNull(),
  
  /** Se está ativo no sistema */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Quantidade de entregas realizadas (histórico) */
  totalDeliveries: integer('total_deliveries').default(0).notNull(),
  
  /** Quando foi criado */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Quando foi atualizado */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relações da tabela neighborhoods
 */
export const neighborhoodsRelations = relations(neighborhoods, ({ one }) => ({
  /** Bairro pertence a uma cidade */
  city: one(cities, {
    fields: [neighborhoods.cityId],
    references: [cities.id],
  }),
}));

/** Tipos inferidos do Drizzle */
export type Neighborhood = typeof neighborhoods.$inferSelect;
export type NewNeighborhood = typeof neighborhoods.$inferInsert;