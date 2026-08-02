import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  atendimentoIaBuscaRagStatusEnum,
  atendimentoIaDocumentoEstadoEnum,
  atendimentoIaIndexacaoStatusEnum,
} from "../enums";
import { atendimentoIaExecucoesTable } from "./operacoes";

export const atendimentoIaDocumentosInstitucionaisTable = pgTable(
  "atendimento_ia_documentos_institucionais",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chaveEstavel: text("chave_estavel").notNull(),
    categoria: text("categoria").notNull(),
    origem: text("origem").notNull(),
    metadados: jsonb("metadados").$type<Record<string, unknown>>().notNull().default({}),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_documentos_chave_unique").on(table.chaveEstavel),
    index("atendimento_ia_documentos_categoria_idx").on(table.categoria),
  ],
);

export const atendimentoIaDocumentoVersoesTable = pgTable(
  "atendimento_ia_documento_versoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentoId: uuid("documento_id")
      .notNull()
      .references(() => atendimentoIaDocumentosInstitucionaisTable.id, {
        onDelete: "cascade",
      }),
    versao: integer("versao").notNull(),
    titulo: text("titulo").notNull(),
    conteudo: text("conteudo").notNull(),
    hashConteudo: text("hash_conteudo").notNull(),
    estado: atendimentoIaDocumentoEstadoEnum("estado").notNull().default("rascunho"),
    responsavelRevisaoId: text("responsavel_revisao_id").references(
      () => userTable.id,
      { onDelete: "set null" },
    ),
    revisadoEm: timestamp("revisado_em"),
    publicadoEm: timestamp("publicado_em"),
    desativadoEm: timestamp("desativado_em"),
    versaoAnteriorId: uuid("versao_anterior_id").references(
      (): AnyPgColumn => atendimentoIaDocumentoVersoesTable.id,
      { onDelete: "set null" },
    ),
    statusIndexacao: atendimentoIaIndexacaoStatusEnum("status_indexacao")
      .notNull()
      .default("pendente"),
    modeloEmbedding: text("modelo_embedding"),
    dimensaoEmbedding: integer("dimensao_embedding"),
    hashIndexacao: text("hash_indexacao"),
    indexadoEm: timestamp("indexado_em"),
    metadados: jsonb("metadados").$type<Record<string, unknown>>().notNull().default({}),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_documento_versoes_numero_unique").on(
      table.documentoId,
      table.versao,
    ),
    uniqueIndex("atendimento_ia_documento_versoes_indexacao_unique")
      .on(table.documentoId, table.hashIndexacao)
      .where(sql`${table.hashIndexacao} is not null`),
    index("atendimento_ia_documento_versoes_estado_idx").on(
      table.estado,
      table.statusIndexacao,
    ),
  ],
);

export const atendimentoIaFragmentosInstitucionaisTable = pgTable(
  "atendimento_ia_fragmentos_institucionais",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versaoDocumentoId: uuid("versao_documento_id")
      .notNull()
      .references(() => atendimentoIaDocumentoVersoesTable.id, {
        onDelete: "cascade",
      }),
    posicao: integer("posicao").notNull(),
    secao: text("secao"),
    conteudo: text("conteudo").notNull(),
    hashConteudo: text("hash_conteudo").notNull(),
    quantidadeTokens: integer("quantidade_tokens").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    modeloEmbedding: text("modelo_embedding").notNull(),
    dimensaoEmbedding: integer("dimensao_embedding").notNull(),
    ativo: boolean("ativo").notNull().default(false),
    indexadoEm: timestamp("indexado_em").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_fragmentos_versao_posicao_unique").on(
      table.versaoDocumentoId,
      table.posicao,
    ),
    index("atendimento_ia_fragmentos_textual_idx").using(
      "gin",
      sql`to_tsvector('portuguese', ${table.conteudo})`,
    ),
    index("atendimento_ia_fragmentos_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("atendimento_ia_fragmentos_ativos_idx").on(table.ativo),
  ],
);

export const atendimentoIaBuscasRagTable = pgTable(
  "atendimento_ia_buscas_rag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    execucaoId: uuid("execucao_id")
      .notNull()
      .references(() => atendimentoIaExecucoesTable.id, { onDelete: "cascade" }),
    hashPergunta: text("hash_pergunta").notNull(),
    status: atendimentoIaBuscaRagStatusEnum("status").notNull(),
    configuracao: jsonb("configuracao").$type<Record<string, unknown>>().notNull(),
    conflito: boolean("conflito").notNull().default(false),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_buscas_rag_execucao_pergunta_unique").on(
      table.execucaoId,
      table.hashPergunta,
    ),
    index("atendimento_ia_buscas_rag_execucao_idx").on(table.execucaoId),
  ],
);

export const atendimentoIaResultadosRagTable = pgTable(
  "atendimento_ia_resultados_rag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buscaId: uuid("busca_id")
      .notNull()
      .references(() => atendimentoIaBuscasRagTable.id, { onDelete: "cascade" }),
    fragmentoId: uuid("fragmento_id")
      .notNull()
      .references(() => atendimentoIaFragmentosInstitucionaisTable.id, {
        onDelete: "restrict",
      }),
    posicao: integer("posicao").notNull(),
    pontuacaoSemantica: real("pontuacao_semantica").notNull(),
    pontuacaoTextual: real("pontuacao_textual").notNull(),
    pontuacaoFinal: real("pontuacao_final").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_resultados_rag_busca_fragmento_unique").on(
      table.buscaId,
      table.fragmentoId,
    ),
    index("atendimento_ia_resultados_rag_busca_posicao_idx").on(
      table.buscaId,
      table.posicao,
    ),
  ],
);
