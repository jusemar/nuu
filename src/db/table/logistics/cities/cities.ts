/**
 * SCHEMA CITIES - Banco de dados Drizzle ORM
 * 
 * Define tabela de cidades atendidas, vinculadas a estados.
 */

import { pgTable, varchar, boolean, timestamp, serial, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { states } from '../states/states';

/**
 * Tabela de cidades
 */
export const cities = pgTable('cities', {
  /** ID único */
  id: serial('id').primaryKey(),
  
  /** Nome da cidade */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** UF do estado (foreign key) */
  stateUf: varchar('state_uf', { length: 2 }).notNull().references(() => states.uf),
  
  /** Se está ativa para entrega */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Quantidade de bairros com rotas configuradas */
  neighborhoodsCount: integer('neighborhoods_count').default(0).notNull(),
  
  /** Se tem slots de entrega configurados */
  hasSlotsConfigured: boolean('has_slots_configured').default(false).notNull(),
  
  /** Quando foi criada */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Quando foi atualizada */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relações da tabela cities
 */
export const citiesRelations = relations(cities, ({ one }) => ({
  /** Cidade pertence a um estado */
  state: one(states, {
    fields: [cities.stateUf],
    references: [states.uf],
  }),
}));

/** Tipos inferidos do Drizzle */
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;