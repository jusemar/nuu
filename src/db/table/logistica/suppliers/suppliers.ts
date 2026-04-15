/**
 * SCHEMA SUPPLIERS - Banco de dados Drizzle ORM
 * 
 * Define tabela de fornecedores que entregam produtos.
 * Inclui loja própria, fornecedores externos e transportadoras parceiras.
 */

import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  serial,
  integer,
  jsonb,
  numeric,
  text 
} from 'drizzle-orm/pg-core';

/**
 * Tipo de fornecedor
 */
export type SupplierType = 
  | 'own'           // Loja própria - você entrega
  | 'supplier'      // Fornecedor externo - drop-shipping
  | 'carrier';      // Transportadora parceira

/**
 * Estrutura de configuração de entrega (JSONB)
 */
export interface DeliveryConfig {
  minDays: number;          // Prazo mínimo
  maxDays: number;          // Prazo máximo
  cutoffTime: string;       // Horário de corte "12:00"
  operatingDays: number[];  // [1,2,3,4,5] = seg a sex
  fixedPrice?: number;      // Preço fixo
  freeAbove?: number;       // Frete grátis acima de
}

/**
 * Estrutura de contato (JSONB)
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  responsible?: string;
}

/**
 * Tabela de fornecedores
 */
export const suppliers = pgTable('suppliers', {
  /** ID único */
  id: serial('id').primaryKey(),
  
  /** Nome do fornecedor */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** Tipo de fornecedor */
  type: varchar('type', { length: 20 }).$type<SupplierType>().notNull(),
  
  /** Descrição da operação de entrega */
  description: text('description').notNull(),
  
  /** Se está ativo */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Configuração de entrega (JSONB) */
  deliveryConfig: jsonb('delivery_config').$type<DeliveryConfig>().notNull(),
  
  /** Regiões atendidas - array de UFs (JSONB) */
  servedRegions: jsonb('served_regions').$type<string[]>().default([]).notNull(),
  
  /** Quantidade de produtos vinculados */
  linkedProductsCount: integer('linked_products_count').default(0).notNull(),
  
  /** Informações de contato (JSONB) */
  contactInfo: jsonb('contact_info').$type<ContactInfo>(),
  
  /** Quando foi criado */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Quando foi atualizado */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/** Tipos inferidos do Drizzle */
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;