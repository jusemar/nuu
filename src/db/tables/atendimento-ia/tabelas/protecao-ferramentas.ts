import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "../../autenticacao";
import {
  atendimentoIaConfirmacaoStatusEnum,
  atendimentoIaOperacaoProtegidaStatusEnum,
} from "../enums";
import { atendimentoIaConversasTable } from "./conversas";
import { atendimentoIaExecucoesTable } from "./operacoes";

export const atendimentoIaConfirmacoesFerramentasTable = pgTable(
  "atendimento_ia_confirmacoes_ferramentas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: text("usuario_id").references(() => userTable.id, {
      onDelete: "cascade",
    }),
    referenciaSessaoHash: text("referencia_sessao_hash").notNull(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => atendimentoIaConversasTable.id, { onDelete: "cascade" }),
    execucaoSolicitacaoId: uuid("execucao_solicitacao_id")
      .notNull()
      .references(() => atendimentoIaExecucoesTable.id, { onDelete: "cascade" }),
    ferramenta: text("ferramenta").notNull(),
    acao: text("acao").notNull(),
    recursoTipo: text("recurso_tipo").notNull(),
    recursoId: text("recurso_id").notNull(),
    parametrosEssenciais: jsonb("parametros_essenciais")
      .$type<Record<string, unknown>>()
      .notNull(),
    hashParametros: text("hash_parametros").notNull(),
    status: atendimentoIaConfirmacaoStatusEnum("status")
      .notNull()
      .default("pendente"),
    expiraEm: timestamp("expira_em").notNull(),
    confirmadaEm: timestamp("confirmada_em"),
    consumidaEm: timestamp("consumida_em"),
    canceladaEm: timestamp("cancelada_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    index("atendimento_ia_confirmacoes_conversa_status_idx").on(
      table.conversaId,
      table.status,
      table.expiraEm,
    ),
    index("atendimento_ia_confirmacoes_usuario_idx").on(table.usuarioId),
    uniqueIndex("atendimento_ia_confirmacoes_operacao_pendente_unique")
      .on(
        table.referenciaSessaoHash,
        table.conversaId,
        table.ferramenta,
        table.hashParametros,
      )
      .where(sql`${table.status} in ('pendente', 'confirmada')`),
  ],
);

export const atendimentoIaOperacoesProtegidasTable = pgTable(
  "atendimento_ia_operacoes_protegidas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    confirmacaoId: uuid("confirmacao_id")
      .notNull()
      .references(() => atendimentoIaConfirmacoesFerramentasTable.id, {
        onDelete: "cascade",
      }),
    execucaoId: uuid("execucao_id")
      .notNull()
      .references(() => atendimentoIaExecucoesTable.id, { onDelete: "cascade" }),
    ferramenta: text("ferramenta").notNull(),
    acao: text("acao").notNull(),
    recursoTipo: text("recurso_tipo").notNull(),
    recursoId: text("recurso_id").notNull(),
    hashParametros: text("hash_parametros").notNull(),
    chaveIdempotencia: text("chave_idempotencia").notNull(),
    status: atendimentoIaOperacaoProtegidaStatusEnum("status")
      .notNull()
      .default("processando"),
    resultado: jsonb("resultado").$type<Record<string, unknown>>(),
    erroSanitizado: text("erro_sanitizado"),
    iniciadoEm: timestamp("iniciado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("atendimento_ia_operacoes_protegidas_idempotencia_unique").on(
      table.chaveIdempotencia,
    ),
    index("atendimento_ia_operacoes_protegidas_confirmacao_idx").on(
      table.confirmacaoId,
    ),
    index("atendimento_ia_operacoes_protegidas_execucao_idx").on(table.execucaoId),
  ],
);
