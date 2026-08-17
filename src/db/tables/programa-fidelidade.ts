import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { categoryTable } from "../table/categories/categories";

/** Configuração única do programa. O id fixo impede mais de um programa global. */
export const configuracoesProgramaFidelidadeTable = pgTable(
  "programa_fidelidade_configuracoes",
  {
    id: text("id").primaryKey().default("global"),
    ativo: boolean("ativo").notNull().default(true),
    nomePublico: text("nome_publico").notNull(),
    pontosPorReal: numeric("pontos_por_real", {
      precision: 12,
      scale: 4,
    }).notNull(),
    pontosConversao: numeric("pontos_conversao", {
      precision: 18,
      scale: 4,
    }).notNull(),
    valorCreditoEmCentavos: integer("valor_credito_em_centavos").notNull(),
    minimoPontosResgate: numeric("minimo_pontos_resgate", {
      precision: 18,
      scale: 4,
    }).notNull(),
    mesesValidade: integer("meses_validade"),
    versao: integer("versao").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("programa_fidelidade_config_id_global", sql`${table.id} = 'global'`),
    check(
      "programa_fidelidade_nome_publico_preenchido",
      sql`length(trim(${table.nomePublico})) BETWEEN 1 AND 80`,
    ),
    check(
      "programa_fidelidade_pontos_por_real_positivo",
      sql`${table.pontosPorReal} > 0`,
    ),
    check(
      "programa_fidelidade_conversao_positiva",
      sql`${table.pontosConversao} > 0`,
    ),
    check(
      "programa_fidelidade_credito_positivo",
      sql`${table.valorCreditoEmCentavos} > 0`,
    ),
    check(
      "programa_fidelidade_resgate_nao_negativo",
      sql`${table.minimoPontosResgate} >= 0`,
    ),
    check(
      "programa_fidelidade_validade_valida",
      sql`${table.mesesValidade} IS NULL OR ${table.mesesValidade} > 0`,
    ),
    check("programa_fidelidade_versao_positiva", sql`${table.versao} > 0`),
  ],
);

/** Override esparso: pontos nulos significam herança da configuração global. */
export const regrasCategoriasProgramaFidelidadeTable = pgTable(
  "programa_fidelidade_regras_categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    ativa: boolean("ativa").notNull().default(true),
    pontosPorReal: numeric("pontos_por_real", {
      precision: 12,
      scale: 4,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("programa_fidelidade_regra_categoria_unique").on(
      table.categoriaId,
    ),
    check(
      "programa_fidelidade_regra_pontos_positivos",
      sql`${table.pontosPorReal} IS NULL OR ${table.pontosPorReal} > 0`,
    ),
  ],
);
