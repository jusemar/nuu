/**
 * SCHEMA STATES - Banco de dados Drizzle ORM
 * 
 * Define tabela de estados atendidos pela loja.
 */

import { pgTable, varchar, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

/**
 * Tabela de estados
 */
export const states = pgTable('states', {
  /** ID único (serial) */
  id: serial('id').primaryKey(),
  
  /** Sigla do estado (UF) - único */
  uf: varchar('uf', { length: 2 }).notNull().unique(),
  
  /** Nome completo do estado */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** Se está ativo para entrega */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Quando foi criado */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Quando foi atualizado */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tipo inferido do Drizzle */
export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;