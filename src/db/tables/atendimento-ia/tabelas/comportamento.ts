import {
  type AnyPgColumn,
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
  atendimentoIaConhecimentoSituacaoEnum,
  atendimentoIaDocumentoEstadoEnum,
} from "../enums";

export const atendimentoIaComportamentosTable = pgTable(
  "atendimento_ia_comportamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chaveEstavel: text("chave_estavel").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao").notNull(),
    situacao: atendimentoIaConhecimentoSituacaoEnum("situacao")
      .notNull()
      .default("ativa"),
    criadoPorId: text("criado_por_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_comportamentos_chave_unique").on(
      table.chaveEstavel,
    ),
    index("atendimento_ia_comportamentos_situacao_idx").on(table.situacao),
  ],
);

export const atendimentoIaComportamentoVersoesTable = pgTable(
  "atendimento_ia_comportamento_versoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comportamentoId: uuid("comportamento_id")
      .notNull()
      .references(() => atendimentoIaComportamentosTable.id, {
        onDelete: "cascade",
      }),
    numeroVersao: integer("numero_versao").notNull(),
    estado: atendimentoIaDocumentoEstadoEnum("estado")
      .notNull()
      .default("rascunho"),
    configuracaoEstruturada: jsonb("configuracao_estruturada")
      .$type<Record<string, unknown>>()
      .notNull(),
    blocosAdministrativos: jsonb("blocos_administrativos")
      .$type<Record<string, unknown>>()
      .notNull(),
    hash: text("hash").notNull(),
    motivoAlteracao: text("motivo_alteracao").notNull(),
    resumoAlteracao: text("resumo_alteracao").notNull(),
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
    publicacaoBloqueada: boolean("publicacao_bloqueada")
      .notNull()
      .default(false),
    motivoBloqueio: text("motivo_bloqueio"),
    restauradaDeVersaoId: uuid("restaurada_de_versao_id").references(
      (): AnyPgColumn => atendimentoIaComportamentoVersoesTable.id,
      { onDelete: "set null" },
    ),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_comportamento_versao_unique").on(
      table.comportamentoId,
      table.numeroVersao,
    ),
    index("atendimento_ia_comportamento_versoes_estado_idx").on(table.estado),
  ],
);
