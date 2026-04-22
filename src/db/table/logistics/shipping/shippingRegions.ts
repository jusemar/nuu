/**
 * SCHEMA SHIPPING REGIONS - Regiões de Entrega Própria (3 Níveis)
 * 
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 * 
 * Sistema de 3 níveis para precificação de frete:
 * Nível 1: Regiões     (ex: "Zona Sul") - vários bairros com mesmo preço
 * Nível 2: Bairros Avulsos (ex: "Pampulha") - bairro isolado com preço próprio  
 * Nível 3: CEPs Específicos (ex: CEP 30140-999) - exceção dentro de região
 * 
 * Prioridade de Consulta:
 * [1] CEP específico → [2] Bairro em Região → [3] Bairro Avulso → [4] Não atendemos
 */

import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  serial, 
  integer,
  text 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * TABELA 1: REGIÕES DE ENTREGA
 * 
 * Representa uma região que agrupa vários bairros.
 * Exemplo: "Zona Sul" agrupa {Savassi, Funcionários, Santo Agostinho}
 * 
 * Uma região tem:
 * - Múltiplos bairros associados (relação N:M via regiao_bairros)
 * - Múltiplos slots de entrega (dias/horários/preço)
 */
export const shippingRegions = pgTable('shipping_regions', {
  id: serial('id').primaryKey(),
  
  /** Nome da região (ex: "Zona Sul", "Zona Norte") */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** Descrição opcional da região */
  description: text('description'),
  
  /** Cidade atendida por esta região */
  city: varchar('city', { length: 100 }).notNull(),
  
  /** Estado (UF) da região */
  state: varchar('state', { length: 2 }).notNull(),
  
  /** Valor do frete desta região (em centavos)
   * Ex: 1500 = R$ 15,00
   * Se um CEP não tem preço específico e não está em bairro avulso,
   * usa este preço base da região */
  baseShippingPrice: integer('base_shipping_price').notNull(),
  
  /** Se a região está ativa para entrega */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Data de criação */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Data de atualização */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * TABELA 2: RELAÇÃO REGIÃO ↔ BAIRROS (N:M)
 * 
 * Une regiões com bairros. Uma região pode ter muitos bairros,
 * um bairro pode estar em várias regiões (ex: bairro fronteira).
 * 
 * Exemplo:
 * - Zona Sul (região) → Savassi, Funcionários, Santo Agostinho (bairros)
 * - Zona Centro (região) → Funcionários, Centro (bairros)
 */
export const regioBairros = pgTable('regiao_bairros', {
  id: serial('id').primaryKey(),
  
  /** ID da região */
  regiaoId: integer('regiao_id').notNull().references(() => shippingRegions.id, { 
    onDelete: 'cascade' 
  }),
  
  /** Nome do bairro (padronizado)
   * Usamos string pois não temos tabela separada de bairros.
   * Exemplo: "Savassi", "Funcionários", "Santo Agostinho"
   * 
   * IMPORTANTE: Deve vir padronizado da API ViaCEP (response.bairro)
   * Para evitar erros de digitação, armazenamos como recebemos do ViaCEP */
  neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
});

/**
 * TABELA 3: BAIRROS AVULSOS
 * 
 * Bairros cadastrados isoladamente (não fazem parte de região).
 * Cada bairro avulso tem seus próprios slots e preço.
 * 
 * Exemplo: "Pampulha" atende apenas certos dias/horários com preço diferente
 * de qualquer região
 */
export const bairrosAvulsos = pgTable('bairros_avulsos', {
  id: serial('id').primaryKey(),
  
  /** Nome do bairro (padronizado do ViaCEP) */
  neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
  
  /** Cidade */
  city: varchar('city', { length: 100 }).notNull(),
  
  /** Estado */
  state: varchar('state', { length: 2 }).notNull(),
  
  /** Preço base do frete para este bairro (em centavos) */
  baseShippingPrice: integer('base_shipping_price').notNull(),
  
  /** Se está ativo */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Data de criação */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Data de atualização */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * TABELA 4: CEPs ESPECÍFICOS (EXCEÇÕES)
 * 
 * Para casos onde um CEP dentro de uma região/bairro tem preço diferente.
 * Exemplo: Condomínio isolado que precisa de entrega mais cara
 * 
 * CEP específico SOBRESCREVE região/bairro quando encontrado.
 * Prioridade: CEP Específico > Região/Bairro
 */
export const cepsEspecificos = pgTable('ceps_especificos', {
  id: serial('id').primaryKey(),
  
  /** CEP sem hífen (8 dígitos)
   * Exemplo: "30140999" representa "30140-999" */
  cep: varchar('cep', { length: 8 }).notNull().unique(),
  
  /** Bairro onde o CEP está localizado (referência) */
  neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
  
  /** Cidade */
  city: varchar('city', { length: 100 }).notNull(),
  
  /** Estado */
  state: varchar('state', { length: 2 }).notNull(),
  
  /** Preço específico deste CEP (em centavos)
   * Sobrescreve preço de região/bairro */
  shippingPrice: integer('shipping_price').notNull(),
  
  /** Se está ativo */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Data de criação */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Data de atualização */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * RELAÇÕES ENTRE TABELAS
 */

export const shippingRegionsRelations = relations(shippingRegions, ({ many }) => ({
  bairros: many(regioBairros),
  slots: many(shippingRegionSlots),
}));

export const regioBairrosRelations = relations(regioBairros, ({ one }) => ({
  regiao: one(shippingRegions, {
    fields: [regioBairros.regiaoId],
    references: [shippingRegions.id],
  }),
}));

export const bairrosAvulsosRelations = relations(bairrosAvulsos, ({ many }) => ({
  slots: many(shippingBairroAvulsoSlots),
}));

/**
 * TABELA 5: SLOTS DE ENTREGA - REGIÕES
 * 
 * Cada região pode ter múltiplos slots (dias/horários disponíveis).
 * Exemplo: Zona Sul funciona seg-ter-qua 09h-17h, quinta 10h-16h, etc
 */
export const shippingRegionSlots = pgTable('shipping_region_slots', {
  id: serial('id').primaryKey(),
  
  /** ID da região */
  regionId: integer('region_id').notNull().references(() => shippingRegions.id, { 
    onDelete: 'cascade' 
  }),
  
  /** Dia da semana (0=domingo, 6=sábado) */
  dayOfWeek: integer('day_of_week').notNull(),
  
  /** Horário de início (ex: "09:00") */
  startTime: varchar('start_time', { length: 5 }).notNull(),
  
  /** Horário de fim (ex: "17:00") */
  endTime: varchar('end_time', { length: 5 }).notNull(),
  
  /** Se está ativo */
  isActive: boolean('is_active').default(true).notNull(),
});

export const shippingRegionSlotsRelations = relations(shippingRegionSlots, ({ one }) => ({
  region: one(shippingRegions, {
    fields: [shippingRegionSlots.regionId],
    references: [shippingRegions.id],
  }),
}));

/**
 * TABELA 6: SLOTS DE ENTREGA - BAIRROS AVULSOS
 * 
 * Cada bairro avulso pode ter múltiplos slots próprios.
 */
export const shippingBairroAvulsoSlots = pgTable('shipping_bairro_avulso_slots', {
  id: serial('id').primaryKey(),
  
  /** ID do bairro avulso */
  bairroAvulsoId: integer('bairro_avulso_id').notNull().references(() => bairrosAvulsos.id, { 
    onDelete: 'cascade' 
  }),
  
  /** Dia da semana */
  dayOfWeek: integer('day_of_week').notNull(),
  
  /** Horário de início */
  startTime: varchar('start_time', { length: 5 }).notNull(),
  
  /** Horário de fim */
  endTime: varchar('end_time', { length: 5 }).notNull(),
  
  /** Se está ativo */
  isActive: boolean('is_active').default(true).notNull(),
});

export const shippingBairroAvulsoSlotsRelations = relations(shippingBairroAvulsoSlots, ({ one }) => ({
  bairroAvulso: one(bairrosAvulsos, {
    fields: [shippingBairroAvulsoSlots.bairroAvulsoId],
    references: [bairrosAvulsos.id],
  }),
}));

/**
 * TIPOS INFERIDOS
 */

export type ShippingRegion = typeof shippingRegions.$inferSelect;
export type NewShippingRegion = typeof shippingRegions.$inferInsert;

export type RegioBairro = typeof regioBairros.$inferSelect;
export type NewRegioBairro = typeof regioBairros.$inferInsert;

export type BairroAvulso = typeof bairrosAvulsos.$inferSelect;
export type NewBairroAvulso = typeof bairrosAvulsos.$inferInsert;

export type CepEspecifico = typeof cepsEspecificos.$inferSelect;
export type NewCepEspecifico = typeof cepsEspecificos.$inferInsert;

export type ShippingRegionSlot = typeof shippingRegionSlots.$inferSelect;
export type NewShippingRegionSlot = typeof shippingRegionSlots.$inferInsert;

export type ShippingBairroAvulsoSlot = typeof shippingBairroAvulsoSlots.$inferSelect;
export type NewShippingBairroAvulsoSlot = typeof shippingBairroAvulsoSlots.$inferInsert;
