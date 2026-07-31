import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  atendimentoIaExecucaoStatusEnum,
  atendimentoIaFerramentaClassificacaoEnum,
} from "../enums";
import {
  atendimentoIaConversasTable,
  atendimentoIaMensagensTable,
} from "./conversas";

export const atendimentoIaExecucoesTable = pgTable(
  "atendimento_ia_execucoes",
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
    modelo: text("modelo").notNull(),
    nivelRaciocinio: text("nivel_raciocinio"),
    status: atendimentoIaExecucaoStatusEnum("status")
      .notNull()
      .default("processando"),
    tokensEntrada: integer("tokens_entrada").notNull().default(0),
    tokensSaida: integer("tokens_saida").notNull().default(0),
    duracaoEmMs: integer("duracao_em_ms"),
    custoEstimadoMicros: integer("custo_estimado_micros")
      .notNull()
      .default(0),
    motivoEscalonamento: text("motivo_escalonamento"),
    erro: text("erro"),
    iniciadoEm: timestamp("iniciado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_execucoes_conversa_iniciado_idx").on(
      table.conversaId,
      table.iniciadoEm,
    ),
    index("atendimento_ia_execucoes_mensagem_idx").on(table.mensagemId),
    index("atendimento_ia_execucoes_status_idx").on(table.status),
  ],
);

export const atendimentoIaExecucoesFerramentasTable = pgTable(
  "atendimento_ia_execucoes_ferramentas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    execucaoId: uuid("execucao_id")
      .notNull()
      .references(() => atendimentoIaExecucoesTable.id, {
        onDelete: "cascade",
      }),
    nomeFerramenta: text("nome_ferramenta").notNull(),
    versaoFerramenta: text("versao_ferramenta").notNull(),
    classificacao:
      atendimentoIaFerramentaClassificacaoEnum("classificacao").notNull(),
    chaveIdempotencia: text("chave_idempotencia"),
    argumentos: jsonb("argumentos").$type<Record<string, unknown>>(),
    resultado: jsonb("resultado").$type<Record<string, unknown>>(),
    status: atendimentoIaExecucaoStatusEnum("status")
      .notNull()
      .default("processando"),
    duracaoEmMs: integer("duracao_em_ms"),
    erro: text("erro"),
    iniciadoEm: timestamp("iniciado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_exec_ferramentas_idempotencia_unique")
      .on(table.chaveIdempotencia)
      .where(sql`${table.chaveIdempotencia} is not null`),
    index("atendimento_ia_exec_ferramentas_execucao_idx").on(table.execucaoId),
    index("atendimento_ia_exec_ferramentas_nome_idx").on(
      table.nomeFerramenta,
    ),
  ],
);

export const atendimentoIaIdempotenciasTable = pgTable(
  "atendimento_ia_idempotencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversaId: uuid("conversa_id").references(
      () => atendimentoIaConversasTable.id,
      { onDelete: "cascade" },
    ),
    escopo: text("escopo").notNull(),
    chave: text("chave").notNull(),
    hashRequisicao: text("hash_requisicao").notNull(),
    status: atendimentoIaExecucaoStatusEnum("status")
      .notNull()
      .default("processando"),
    referenciaResultado: text("referencia_resultado"),
    expiraEm: timestamp("expira_em").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_idempotencias_escopo_chave_unique").on(
      table.escopo,
      table.chave,
    ),
    index("atendimento_ia_idempotencias_expiracao_idx").on(table.expiraEm),
  ],
);
