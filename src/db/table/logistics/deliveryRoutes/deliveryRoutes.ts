/**
 * SCHEMA DELIVERY ROUTES - Banco de dados Drizzle ORM
 * 
 * Define tabela de rotas de entrega própria com faixas de CEP e slots.
 * Cada rota tem configuração de bairro/cidade/UF validada pelo admin.
 * Além da tabela de rotas, temos uma tabela de slots relacionada (1 rota → muitos slots).
 */

import { 
  pgTable, 
  varchar, 
  boolean, 
  timestamp, 
  serial, 
  integer 
} from 'drizzle-orm/pg-core';
// 'relations' é usado para criar relações entre tabelas (foreign keys)
// Permite fazer JOINs e navegar entre tabelas relacionadas
import { relations } from 'drizzle-orm';

/**
 * =====================================================================
 * TABELA 1: DELIVERY_ROUTES
 * =====================================================================
 * Armazena as rotas de entrega própria cadastradas pelo admin.
 * Cada rota representa uma faixa de CEP com configuração de entrega.
 * 
 * Campos:
 * - id: identificador único da rota (chave primária)
 * - name: nome amigável da rota (ex: "Zona Sul — Jardins")
 * - cepStart: CEP inicial da faixa (sem hífen, ex: "01400000")
 * - cepEnd: CEP final da faixa (sem hífen, ex: "01599999")
 * - officialNeighborhood: bairro retornado pela API ViaCEP (para auditoria)
 * - registeredNeighborhood: bairro confirmado/corrigido pelo admin
 * - city: nome da cidade
 * - state: UF do estado (ex: "SP")
 * - isActive: se a rota está ativa para entrega
 * - createdAt: data de criação do registro
 * - updatedAt: data da última atualização
 */
export const deliveryRoutes = pgTable('delivery_routes', {
  /** ID único - chave primária da tabela
   * serial gera automaticamente um número sequencial (1, 2, 3...)
   * primaryKey() marca como chave primária */
  id: serial('id').primaryKey(),
  
  /** Nome da rota - exemplo: "Zona Sul — Jardins"
   * varchar com limite de 100 caracteres
   * notNull() significa campo obrigatório */
  name: varchar('name', { length: 100 }).notNull(),
  
  /** CEP inicial da faixa de CEP (sem hífen)
   * Armazenamos sem hífen para facilitar comparações numéricas
   * Exemplo: "01400000" representa "01400-000" */
  cepStart: varchar('cep_start', { length: 8 }).notNull(),
  
  /** CEP final da faixa de CEP (sem hífen)
   * Exemplo: "01599999" representa "01599-999" */
  cepEnd: varchar('cep_end', { length: 8 }).notNull(),
  
  /** Bairro retornado pela API ViaCEP (opcional)
   * Usado para auditoria - comparação com o bairro registrado
   * Pode ser nulo se ViaCEP não retornou dados */
  officialNeighborhood: varchar('official_neighborhood', { length: 100 }),
  
  /** Bairro confirmado pelo admin após validação
   * Este é o nome oficial usado no sistema
   * Campo obrigatório (notNull) */
  registeredNeighborhood: varchar('registered_neighborhood', { length: 100 }).notNull(),
  
  /** Nome da cidade onde a rota atende
   * Exemplo: "São Paulo" */
  city: varchar('city', { length: 100 }).notNull(),
  
  /** UF do estado (sigla com 2 letras)
   * Exemplo: "SP", "RJ", "MG" */
  state: varchar('state', { length: 2 }).notNull(),
  
  /** Se a rota está ativa para entregas
   * default(true) define valor padrão como true
   * Novas rotas são criadas ativas por padrão */
  isActive: boolean('is_active').default(true).notNull(),
  
  /** Data de criação do registro
   * defaultNow() usa a data/hora atual automaticamente
   * Não pode ser nulo (notNull) */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /** Data da última atualização
   * Atualizada automaticamente em updates
   * Não pode ser nulo (notNull) */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * =====================================================================
 * TABELA 2: DELIVERY_ROUTE_SLOTS
 * =====================================================================
 * Armazena os slots de entrega de cada rota.
 * Um slot = um dia da semana + horário de entrega + preço.
 * 
 * Relation: 1 rota pode ter muitos slots (1:N)
 * Quando uma rota é deletada, seus slots também são (onDelete: cascade)
 * 
 * Campos:
 * - id: identificador único do slot
 * - routeId: referência à rota pai (foreign key)
 * - dayOfWeek: dia da semana (0=Domingo, 6=Sábado)
 * - startTime: horário de início da entrega
 * - endTime: horário de fim da entrega
 * - shippingPrice: preço do frete em centavos
 * - isActive: se o slot está ativo
 */
export const deliveryRouteSlots = pgTable('delivery_route_slots', {
  /** ID único do slot - chave primária */
  id: serial('id').primaryKey(),
  
  /** ID da rota a qual este slot pertence
   * references() cria a relação com a tabela deliveryRoutes
   * onDelete: 'cascade' deleta os slots quando a rota é deletada
   * Isso evita deixar "órfãos" no banco */
  routeId: integer('route_id').notNull().references(() => deliveryRoutes.id, { onDelete: 'cascade' }),
  
  /** Dia da semana (0 a 6)
   * 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
   * Usamos número pois é mais fácil de comparar */
  dayOfWeek: integer('day_of_week').notNull(),
  
  /** Horário de início da janela de entrega
   * Formato: "HH:MM" (ex: "08:00")
   * Valor em string para manter o formato */
  startTime: varchar('start_time', { length: 5 }).notNull(),
  
  /** Horário de fim da janela de entrega
   * Formato: "HH:MM" (ex: "13:00") */
  endTime: varchar('end_time', { length: 5 }).notNull(),
  
  /** Preço do frete neste slot
   * Valor EM CENTAVOS (ex: 1000 = R$ 10,00)
   * Internamente guardamos em centavos para evitar problemas decimais */
  shippingPrice: integer('shipping_price').notNull(),
  
  /** Se o slot está ativo para entregas
   * default(true) = novo slot já nasce ativo */
  isActive: boolean('is_active').default(true).notNull(),
});

/**
 * =====================================================================
 * RELAÇÕES ENTRE TABELAS
 * =====================================================================
 * Relations definem como as tabelas se relacionam.
 * Usamos isso para fazer JOINs e acessar dados relacionados.
 */

export const deliveryRoutesRelations = relations(deliveryRoutes, ({ many }) => ({
  /** Uma rota tem muitos slots relacionados
   * many() indica relação 1:N (uma rota -> muitos slots)
   * Isso permite fazer: db.select().from(deliveryRoutes).with(...) */
  slots: many(deliveryRouteSlots),
}));

/** Relation da tabela de slots - cada slot pertence a uma rota */
export const deliveryRouteSlotsRelations = relations(deliveryRouteSlots, ({ one }) => ({
  /** Cada slot pertence a uma única rota
   * one() indica relação N:1 (muitos slots -> uma rota)
   * fields: [deliveryRouteSlots.routeId] = campo na tabela filho
   * references: [deliveryRoutes.id] = campo na tabela pai */
  route: one(deliveryRoutes, {
    fields: [deliveryRouteSlots.routeId],
    references: [deliveryRoutes.id],
  }),
}));

/**
 * =====================================================================
 * TIPOS INFERIDOS DO DRIZZLE
 * =====================================================================
 * Tipos automáticos baseados na estrutura da tabela.
 * Usamos esses tipos no TypeScript para tipar dados.
 */

export type DeliveryRoute = typeof deliveryRoutes.$inferSelect;
// Tipo paraselect: representa um registro completo da tabela
// Ex: { id: 1, name: "Zona Sul", cepStart: "01400000", ... }

export type NewDeliveryRoute = typeof deliveryRoutes.$inferInsert;
// Tipo parainsert: representa dados para criar novo registro
// Ex: { name: "Nova Rota", cepStart: "01400000", ... }
// Não inclui id (gerado automaticamente) nem createdAt/updatedAt (definidos automaticamente)

export type DeliveryRouteSlot = typeof deliveryRouteSlots.$inferSelect;
// Tipo para select de slot

export type NewDeliveryRouteSlot = typeof deliveryRouteSlots.$inferInsert;
// Tipo para insert de slot