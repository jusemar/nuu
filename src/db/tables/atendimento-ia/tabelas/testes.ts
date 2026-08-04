import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  atendimentoIaCasoTesteCategoriaEnum,
  atendimentoIaCasoTesteCriticidadeEnum,
  atendimentoIaCasoTesteDadosOrigemEnum,
  atendimentoIaCasoTesteEstadoEnum,
} from "../enums";

export const atendimentoIaCasosTesteTable = pgTable(
  "atendimento_ia_casos_teste",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chaveEstavel: text("chave_estavel").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao").notNull(),
    categoria: atendimentoIaCasoTesteCategoriaEnum("categoria").notNull(),
    criticidade: atendimentoIaCasoTesteCriticidadeEnum("criticidade").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoPorId: text("criado_por_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("atendimento_ia_casos_teste_chave_unique").on(
      tabela.chaveEstavel,
    ),
    index("atendimento_ia_casos_teste_filtros_idx").on(
      tabela.ativo,
      tabela.categoria,
      tabela.criticidade,
    ),
  ],
);

export const atendimentoIaCasoTesteVersoesTable = pgTable(
  "atendimento_ia_caso_teste_versoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    casoTesteId: uuid("caso_teste_id")
      .notNull()
      .references(() => atendimentoIaCasosTesteTable.id, {
        onDelete: "cascade",
      }),
    numeroVersao: integer("numero_versao").notNull(),
    estado: atendimentoIaCasoTesteEstadoEnum("estado")
      .notNull()
      .default("rascunho"),
    entradaControlada: jsonb("entrada_controlada")
      .$type<Record<string, unknown>>()
      .notNull(),
    contextoSimulado: jsonb("contexto_simulado")
      .$type<Record<string, unknown>>()
      .notNull(),
    expectativas: jsonb("expectativas")
      .$type<Record<string, unknown>>()
      .notNull(),
    ferramentasPermitidas: jsonb("ferramentas_permitidas")
      .$type<string[]>()
      .notNull(),
    ferramentasProibidas: jsonb("ferramentas_proibidas")
      .$type<string[]>()
      .notNull(),
    efeitosEsperados: text("efeitos_esperados").notNull().default("nenhum"),
    criterios: jsonb("criterios").$type<string[]>().notNull(),
    dadosOrigem: atendimentoIaCasoTesteDadosOrigemEnum("dados_origem")
      .notNull()
      .default("ficticio"),
    justificativaSnapshot: text("justificativa_snapshot"),
    autorizadoSnapshotPorId: text("autorizado_snapshot_por_id").references(
      () => userTable.id,
      { onDelete: "set null" },
    ),
    versaoAnteriorId: uuid("versao_anterior_id"),
    hash: text("hash").notNull(),
    criadoPorId: text("criado_por_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    enviadoRevisaoPorId: text("enviado_revisao_por_id").references(
      () => userTable.id,
      { onDelete: "set null" },
    ),
    enviadoRevisaoEm: timestamp("enviado_revisao_em"),
    revisadoPorId: text("revisado_por_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    revisadoEm: timestamp("revisado_em"),
    motivoReprovacao: text("motivo_reprovacao"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("atendimento_ia_caso_teste_versao_unique").on(
      tabela.casoTesteId,
      tabela.numeroVersao,
    ),
    index("atendimento_ia_caso_teste_versoes_estado_idx").on(tabela.estado),
  ],
);

export const atendimentoIaConjuntosTesteTable = pgTable(
  "atendimento_ia_conjuntos_teste",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chaveEstavel: text("chave_estavel").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao").notNull(),
    finalidade: text("finalidade").notNull(),
    criticidadeMinima:
      atendimentoIaCasoTesteCriticidadeEnum("criticidade_minima").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoPorId: text("criado_por_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("atendimento_ia_conjuntos_teste_chave_unique").on(
      tabela.chaveEstavel,
    ),
  ],
);

export const atendimentoIaConjuntoTesteCasosTable = pgTable(
  "atendimento_ia_conjunto_teste_casos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conjuntoTesteId: uuid("conjunto_teste_id")
      .notNull()
      .references(() => atendimentoIaConjuntosTesteTable.id, {
        onDelete: "cascade",
      }),
    casoTesteVersaoId: uuid("caso_teste_versao_id")
      .notNull()
      .references(() => atendimentoIaCasoTesteVersoesTable.id, {
        onDelete: "restrict",
      }),
    ordem: integer("ordem").notNull(),
    obrigatorio: boolean("obrigatorio").notNull().default(true),
    bloqueiaPublicacao: boolean("bloqueia_publicacao").notNull().default(false),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (tabela) => [
    uniqueIndex("atendimento_ia_conjunto_teste_caso_unique").on(
      tabela.conjuntoTesteId,
      tabela.casoTesteVersaoId,
    ),
    uniqueIndex("atendimento_ia_conjunto_teste_ordem_unique").on(
      tabela.conjuntoTesteId,
      tabela.ordem,
    ),
  ],
);
