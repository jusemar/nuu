/**
 * SCHEMA DELIVERY METHODS - Banco de dados Drizzle ORM
 * 
 * Define tabela de modalidades de entrega (motoboy, transportadora, etc).
 * Configurações globais de preço, prazo e horários de corte.
 */

import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  serial,
  integer,
  jsonb,
  numeric 
} from 'drizzle-orm/pg-core';

/**
 * Tipo de modalidade de entrega
 */
export type DeliveryMethodType = 
  | 'motoboy'           // Entrega rápida em cidade
  | 'transportadora'    // Entrega em todo país
  | 'supplier'          // Fornecedor entrega direto (drop-shipping)
  | 'pickup';           // Cliente retira no local

/**
 * Estrutura de configuração de preço (JSONB)
 */
export interface PriceConfig {
  fixed?: number;           // Preço fixo
  perKm?: number;           // Preço por km
  perWeight?: number;       // Preço por peso
  freeAbove?: number;       // Frete grátis acima de
}

/**
 * Estrutura de horário de corte (JSONB)
 */
export interface CutoffTime {
  day: number | 'all';      // 0-6 ou 'all' para todos
  time: string;             // "12:00"
}

/**
 * Estrutura de dimensões máximas (JSONB)
 */
export interface MaxDimensions {
  length: number;           // cm
  width: number;            // cm
  height: number;           // cm
}

/**
 * Tabela de modalidades de entrega
 */
export const deliveryMethods = pgTable('delivery_methods', {
  /** ID único */
  id: serial('id').primaryKey(),
  
  /** Nome da modalidade (ex: "Same Day Delivery") */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** Tipo de modalidade */
  type: varchar('type', { length: 20 }).$type<DeliveryMethodType>().notNull(),
  
  /** Descrição para o cliente */
  description: varchar('description', { length: 255 }).notNull(),
  
  /** Se está ativa */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Configuração de preço (JSONB) */
  priceConfig: jsonb('price_config').$type<PriceConfig>().notNull(),
  
  /** Prazo mínimo em dias */
  minDays: integer('min_days').default(0).notNull(),
  
  /** Prazo máximo em dias */
  maxDays: integer('max_days').default(0).notNull(),
  
  /** Horários de corte (JSONB array) */
  cutoffTimes: jsonb('cutoff_times').$type<CutoffTime[]>().default([]).notNull(),
  
  /** Se permite agendamento de data específica */
  allowsScheduling: boolean('allows_scheduling').default(false).notNull(),
  
  /** Dias de operação (0-6, array JSONB) */
  operatingDays: jsonb('operating_days').$type<number[]>().default([1,2,3,4,5,6]).notNull(),
  
  /** Peso máximo em kg */
  maxWeight: numeric('max_weight', { precision: 8, scale: 2 }),
  
  /** Dimensões máximas (JSONB) */
  maxDimensions: jsonb('max_dimensions').$type<MaxDimensions>(),
  
  /** Quando foi criada */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Quando foi atualizada */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tipos inferidos do Drizzle */
export type DeliveryMethod = typeof deliveryMethods.$inferSelect;
export type NewDeliveryMethod = typeof deliveryMethods.$inferInsert;