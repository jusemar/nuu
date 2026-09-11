import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { categoryTable } from "../../../table/categories/categories";
import { cities } from "../../../table/logistics/cities/cities";
import {
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegions,
} from "../../../table/logistics/entrega-propria";
import { productTable } from "../../../table/products/products";
import { modelosRetiradaTable } from "../../../table/retirada/modelos-retirada";

export const politicasEntregaPropriaTable = pgTable(
  "politicas_entrega_propria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escopo: text("escopo").$type<"produto" | "categoria">().notNull(),
    produtoId: uuid("produto_id").references(() => productTable.id, {
      onDelete: "cascade",
    }),
    categoriaId: uuid("categoria_id").references(() => categoryTable.id, {
      onDelete: "cascade",
    }),
    incluirDescendentes: boolean("incluir_descendentes")
      .notNull()
      .default(false),
    ativa: boolean("ativa").notNull().default(true),
    entregaRapidaAtiva: boolean("entrega_rapida_ativa").notNull().default(true),
    entregaProgramadaAtiva: boolean("entrega_programada_ativa")
      .notNull()
      .default(false),
    diasAtendidos: integer("dias_atendidos").array().notNull().default([]),
    horarioCorte: text("horario_corte"),
    prazoMinimoProgramadaDias: integer("prazo_minimo_programada_dias"),
    permiteRetirada: boolean("permite_retirada"),
    modeloRetiradaId: uuid("modelo_retirada_id").references(
      () => modelosRetiradaTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("politicas_entrega_propria_produto_uidx")
      .on(table.produtoId)
      .where(sql`${table.escopo} = 'produto'`),
    uniqueIndex("politicas_entrega_propria_categoria_uidx")
      .on(table.categoriaId)
      .where(sql`${table.escopo} = 'categoria'`),
    index("politicas_entrega_propria_ativa_idx").on(table.ativa),
    check(
      "politicas_entrega_propria_escopo_check",
      sql`(${table.escopo} = 'produto' AND ${table.produtoId} IS NOT NULL AND ${table.categoriaId} IS NULL AND ${table.incluirDescendentes} = false) OR (${table.escopo} = 'categoria' AND ${table.categoriaId} IS NOT NULL AND ${table.produtoId} IS NULL)`,
    ),
    check(
      "politicas_entrega_propria_dias_check",
      sql`${table.diasAtendidos} <@ ARRAY[0,1,2,3,4,5,6]::integer[]`,
    ),
    check(
      "politicas_entrega_propria_corte_check",
      sql`${table.horarioCorte} IS NULL OR ${table.horarioCorte} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
    check(
      "politicas_entrega_propria_programada_check",
      sql`(${table.prazoMinimoProgramadaDias} IS NULL OR ${table.prazoMinimoProgramadaDias} >= 0) AND (NOT ${table.entregaRapidaAtiva} OR (${table.horarioCorte} IS NOT NULL AND cardinality(${table.diasAtendidos}) > 0)) AND (NOT ${table.entregaProgramadaAtiva} OR (${table.prazoMinimoProgramadaDias} IS NOT NULL AND cardinality(${table.diasAtendidos}) > 0))`,
    ),
    check(
      "politicas_entrega_propria_retirada_check",
      sql`${table.permiteRetirada} IS DISTINCT FROM true OR ${table.modeloRetiradaId} IS NOT NULL`,
    ),
  ],
);

export const precosPoliticasEntregaPropriaTable = pgTable(
  "precos_politicas_entrega_propria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    politicaId: uuid("politica_id")
      .notNull()
      .references(() => politicasEntregaPropriaTable.id, {
        onDelete: "cascade",
      }),
    tipoDestino: text("tipo_destino")
      .$type<"cep" | "bairro" | "regiao" | "cidade" | "uf">()
      .notNull(),
    cepEspecificoId: integer("cep_especifico_id").references(
      () => cepsEspecificos.id,
      { onDelete: "cascade" },
    ),
    bairroAvulsoId: integer("bairro_avulso_id").references(
      () => bairrosAvulsos.id,
      { onDelete: "cascade" },
    ),
    regiaoId: integer("regiao_id").references(() => shippingRegions.id, {
      onDelete: "cascade",
    }),
    cidadeId: integer("cidade_id").references(() => cities.id, {
      onDelete: "cascade",
    }),
    uf: text("uf"),
    precoRapidaEmCentavos: integer("preco_rapida_em_centavos"),
    precoProgramadaEmCentavos: integer("preco_programada_em_centavos"),
    ativa: boolean("ativa").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("precos_politicas_entrega_propria_politica_idx").on(table.politicaId),
    uniqueIndex("precos_politicas_entrega_propria_cep_uidx")
      .on(table.politicaId, table.cepEspecificoId)
      .where(sql`${table.tipoDestino} = 'cep'`),
    uniqueIndex("precos_politicas_entrega_propria_bairro_uidx")
      .on(table.politicaId, table.bairroAvulsoId)
      .where(sql`${table.tipoDestino} = 'bairro'`),
    uniqueIndex("precos_politicas_entrega_propria_regiao_uidx")
      .on(table.politicaId, table.regiaoId)
      .where(sql`${table.tipoDestino} = 'regiao'`),
    uniqueIndex("precos_politicas_entrega_propria_cidade_uidx")
      .on(table.politicaId, table.cidadeId)
      .where(sql`${table.tipoDestino} = 'cidade'`),
    uniqueIndex("precos_politicas_entrega_propria_uf_uidx")
      .on(table.politicaId, table.uf)
      .where(sql`${table.tipoDestino} = 'uf'`),
    check(
      "precos_politicas_entrega_propria_destino_check",
      sql`(${table.tipoDestino} = 'cep' AND ${table.cepEspecificoId} IS NOT NULL AND ${table.bairroAvulsoId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.cidadeId} IS NULL AND ${table.uf} IS NULL) OR (${table.tipoDestino} = 'bairro' AND ${table.bairroAvulsoId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.cidadeId} IS NULL AND ${table.uf} IS NULL) OR (${table.tipoDestino} = 'regiao' AND ${table.regiaoId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL AND ${table.bairroAvulsoId} IS NULL AND ${table.cidadeId} IS NULL AND ${table.uf} IS NULL) OR (${table.tipoDestino} = 'cidade' AND ${table.cidadeId} IS NOT NULL AND ${table.cepEspecificoId} IS NULL AND ${table.bairroAvulsoId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.uf} IS NULL) OR (${table.tipoDestino} = 'uf' AND ${table.uf} ~ '^[A-Z]{2}$' AND ${table.cepEspecificoId} IS NULL AND ${table.bairroAvulsoId} IS NULL AND ${table.regiaoId} IS NULL AND ${table.cidadeId} IS NULL)`,
    ),
    check(
      "precos_politicas_entrega_propria_valores_check",
      sql`(${table.precoRapidaEmCentavos} IS NULL OR ${table.precoRapidaEmCentavos} >= 0) AND (${table.precoProgramadaEmCentavos} IS NULL OR ${table.precoProgramadaEmCentavos} >= 0) AND (${table.precoRapidaEmCentavos} IS NOT NULL OR ${table.precoProgramadaEmCentavos} IS NOT NULL)`,
    ),
  ],
);

export type PoliticaEntregaPropria =
  typeof politicasEntregaPropriaTable.$inferSelect;
export type PrecoPoliticaEntregaPropria =
  typeof precosPoliticasEntregaPropriaTable.$inferSelect;
