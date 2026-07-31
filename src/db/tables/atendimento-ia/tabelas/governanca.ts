import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  atendimentoIaTipoFalhaEnum,
  atendimentoIaTransferenciaStatusEnum,
} from "../enums";
import {
  atendimentoIaConversasTable,
  atendimentoIaMensagensTable,
} from "./conversas";
import {
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
} from "./operacoes";

export const atendimentoIaTransferenciasTable = pgTable(
  "atendimento_ia_transferencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    mensagemSolicitacaoId: uuid("mensagem_solicitacao_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    motivo: text("motivo").notNull(),
    resumo: text("resumo").notNull(),
    dadosConfirmados: jsonb("dados_confirmados")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    pendencias: jsonb("pendencias")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: atendimentoIaTransferenciaStatusEnum("status")
      .notNull()
      .default("solicitada"),
    referenciaExterna: text("referencia_externa"),
    solicitadoEm: timestamp("solicitado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_transferencias_conversa_status_idx").on(
      table.conversaId,
      table.status,
    ),
  ],
);

export const atendimentoIaAvaliacoesTable = pgTable(
  "atendimento_ia_avaliacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, {
        onDelete: "cascade",
      }),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    origem: text("origem").notNull(),
    nota: integer("nota"),
    criterios: jsonb("criterios").$type<Record<string, unknown>>(),
    comentario: text("comentario"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_avaliacoes_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
  ],
);

export const atendimentoIaOcorrenciasTable = pgTable(
  "atendimento_ia_ocorrencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "set null" },
    ),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    execucaoId: uuid("execucao_id").references(
      () => atendimentoIaExecucoesTable.id,
      { onDelete: "set null" },
    ),
    tipo: atendimentoIaTipoFalhaEnum("tipo").notNull(),
    descricaoSanitizada: text("descricao_sanitizada").notNull(),
    recuperacaoTentada: boolean("recuperacao_tentada")
      .notNull()
      .default(false),
    recuperacaoConcluida: boolean("recuperacao_concluida")
      .notNull()
      .default(false),
    resolvidaEm: timestamp("resolvida_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_ocorrencias_tipo_criado_idx").on(
      table.tipo,
      table.criadoEm,
    ),
    index("atendimento_ia_ocorrencias_conversa_idx").on(table.conversaId),
  ],
);

export const atendimentoIaAuditoriasTable = pgTable(
  "atendimento_ia_auditorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "set null" },
    ),
    mensagemId: uuid("mensagem_id").references(
      () => atendimentoIaMensagensTable.id,
      { onDelete: "set null" },
    ),
    execucaoId: uuid("execucao_id").references(
      () => atendimentoIaExecucoesTable.id,
      { onDelete: "set null" },
    ),
    execucaoFerramentaId: uuid("execucao_ferramenta_id").references(
      () => atendimentoIaExecucoesFerramentasTable.id,
      { onDelete: "set null" },
    ),
    evento: text("evento").notNull(),
    tipoAtor: text("tipo_ator").notNull(),
    identificadorAtor: text("identificador_ator"),
    metadados: jsonb("metadados").$type<Record<string, unknown>>(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_auditorias_conversa_criado_idx").on(
      table.conversaId,
      table.criadoEm,
    ),
    index("atendimento_ia_auditorias_evento_idx").on(table.evento),
  ],
);
