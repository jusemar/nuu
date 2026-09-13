import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { cities } from "../cities/cities";
import { bairrosEntregaPropria } from "./bairrosEntregaPropria";
import { cepsEspecificos, shippingRegions } from "./shippingRegions";

/** Única fonte de dias atendidos e horário de corte da Entrega Própria. */
export const agendasGeograficasEntregaPropria = pgTable(
  "agendas_geograficas_entrega_propria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tipoDestino: text("tipo_destino")
      .$type<"cidade" | "regiao" | "bairro" | "cep">()
      .notNull(),
    cidadeId: integer("cidade_id").references(() => cities.id, {
      onDelete: "restrict",
    }),
    regiaoId: integer("regiao_id").references(() => shippingRegions.id, {
      onDelete: "restrict",
    }),
    bairroId: integer("bairro_id").references(() => bairrosEntregaPropria.id, {
      onDelete: "restrict",
    }),
    cepEspecificoId: integer("cep_especifico_id").references(
      () => cepsEspecificos.id,
      { onDelete: "restrict" },
    ),
    ativa: boolean("ativa").notNull().default(true),
    diasAtendidos: integer("dias_atendidos").array().notNull().default([]),
    horarioCorte: text("horario_corte").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("agendas_geograficas_cidade_uidx")
      .on(table.cidadeId)
      .where(sql`${table.tipoDestino} = 'cidade'`),
    uniqueIndex("agendas_geograficas_regiao_uidx")
      .on(table.regiaoId)
      .where(sql`${table.tipoDestino} = 'regiao'`),
    uniqueIndex("agendas_geograficas_bairro_uidx")
      .on(table.bairroId)
      .where(sql`${table.tipoDestino} = 'bairro'`),
    uniqueIndex("agendas_geograficas_cep_uidx")
      .on(table.cepEspecificoId)
      .where(sql`${table.tipoDestino} = 'cep'`),
    index("agendas_geograficas_ativa_idx").on(table.ativa),
    check(
      "agendas_geograficas_destino_check",
      sql`(${table.tipoDestino} = 'cidade' AND ${table.cidadeId} IS NOT NULL AND ${table.regiaoId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL) OR (${table.tipoDestino} = 'regiao' AND ${table.cidadeId} IS NULL AND ${table.regiaoId} IS NOT NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NULL) OR (${table.tipoDestino} = 'bairro' AND ${table.cidadeId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.bairroId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL) OR (${table.tipoDestino} = 'cep' AND ${table.cidadeId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.bairroId} IS NULL AND ${table.cepEspecificoId} IS NOT NULL)`,
    ),
    check(
      "agendas_geograficas_dias_check",
      sql`cardinality(${table.diasAtendidos}) > 0 AND ${table.diasAtendidos} <@ ARRAY[0,1,2,3,4,5,6]::integer[]`,
    ),
    check(
      "agendas_geograficas_corte_check",
      sql`${table.horarioCorte} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
  ],
);

/** Datas sem operação, compartilhadas por todos os níveis que herdam a agenda. */
export const datasBloqueadasAgendaEntregaPropria = pgTable(
  "datas_bloqueadas_agenda_entrega_propria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agendaId: uuid("agenda_id")
      .notNull()
      .references(() => agendasGeograficasEntregaPropria.id, {
        onDelete: "cascade",
      }),
    data: date("data").notNull(),
    motivo: text("motivo"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("datas_bloqueadas_agenda_data_uidx").on(
      table.agendaId,
      table.data,
    ),
  ],
);

export const agendasGeograficasEntregaPropriaRelations = relations(
  agendasGeograficasEntregaPropria,
  ({ one, many }) => ({
    cidade: one(cities, {
      fields: [agendasGeograficasEntregaPropria.cidadeId],
      references: [cities.id],
    }),
    regiao: one(shippingRegions, {
      fields: [agendasGeograficasEntregaPropria.regiaoId],
      references: [shippingRegions.id],
    }),
    bairro: one(bairrosEntregaPropria, {
      fields: [agendasGeograficasEntregaPropria.bairroId],
      references: [bairrosEntregaPropria.id],
    }),
    cepEspecifico: one(cepsEspecificos, {
      fields: [agendasGeograficasEntregaPropria.cepEspecificoId],
      references: [cepsEspecificos.id],
    }),
    datasBloqueadas: many(datasBloqueadasAgendaEntregaPropria),
  }),
);

export const datasBloqueadasAgendaEntregaPropriaRelations = relations(
  datasBloqueadasAgendaEntregaPropria,
  ({ one }) => ({
    agenda: one(agendasGeograficasEntregaPropria, {
      fields: [datasBloqueadasAgendaEntregaPropria.agendaId],
      references: [agendasGeograficasEntregaPropria.id],
    }),
  }),
);

export type AgendaGeograficaEntregaPropria =
  typeof agendasGeograficasEntregaPropria.$inferSelect;
