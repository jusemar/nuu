import { relations } from "drizzle-orm";

import { userTable } from "../autenticacao";
import {
  atendimentoIaConversasTable,
  atendimentoIaEstadosTable,
  atendimentoIaMemoriasTable,
  atendimentoIaMensagensTable,
  atendimentoIaResumosTable,
} from "./tabelas/conversas";
import {
  atendimentoIaAuditoriasTable,
  atendimentoIaAvaliacoesTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaTransferenciasTable,
} from "./tabelas/governanca";
import {
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaIdempotenciasTable,
} from "./tabelas/operacoes";

export const atendimentoIaConversasRelations = relations(
  atendimentoIaConversasTable,
  ({ many, one }) => ({
    usuario: one(userTable, {
      fields: [atendimentoIaConversasTable.usuarioId],
      references: [userTable.id],
    }),
    mensagens: many(atendimentoIaMensagensTable),
    estado: one(atendimentoIaEstadosTable),
    resumos: many(atendimentoIaResumosTable),
    memoriasOriginadas: many(atendimentoIaMemoriasTable),
    execucoes: many(atendimentoIaExecucoesTable),
    transferencias: many(atendimentoIaTransferenciasTable),
    avaliacoes: many(atendimentoIaAvaliacoesTable),
    ocorrencias: many(atendimentoIaOcorrenciasTable),
    auditorias: many(atendimentoIaAuditoriasTable),
    idempotencias: many(atendimentoIaIdempotenciasTable),
  }),
);

export const atendimentoIaMensagensRelations = relations(
  atendimentoIaMensagensTable,
  ({ many, one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaMensagensTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    resumos: many(atendimentoIaResumosTable),
    execucoes: many(atendimentoIaExecucoesTable),
    transferencias: many(atendimentoIaTransferenciasTable),
    avaliacoes: many(atendimentoIaAvaliacoesTable),
    ocorrencias: many(atendimentoIaOcorrenciasTable),
    auditorias: many(atendimentoIaAuditoriasTable),
  }),
);

export const atendimentoIaEstadosRelations = relations(
  atendimentoIaEstadosTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaEstadosTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
  }),
);

export const atendimentoIaResumosRelations = relations(
  atendimentoIaResumosTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaResumosTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    ateMensagem: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaResumosTable.ateMensagemId],
      references: [atendimentoIaMensagensTable.id],
    }),
  }),
);

export const atendimentoIaMemoriasRelations = relations(
  atendimentoIaMemoriasTable,
  ({ one }) => ({
    usuario: one(userTable, {
      fields: [atendimentoIaMemoriasTable.usuarioId],
      references: [userTable.id],
    }),
    conversaOrigem: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaMemoriasTable.conversaOrigemId],
      references: [atendimentoIaConversasTable.id],
    }),
  }),
);

export const atendimentoIaExecucoesRelations = relations(
  atendimentoIaExecucoesTable,
  ({ many, one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaExecucoesTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    mensagem: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaExecucoesTable.mensagemId],
      references: [atendimentoIaMensagensTable.id],
    }),
    ferramentas: many(atendimentoIaExecucoesFerramentasTable),
    ocorrencias: many(atendimentoIaOcorrenciasTable),
    auditorias: many(atendimentoIaAuditoriasTable),
  }),
);

export const atendimentoIaExecucoesFerramentasRelations = relations(
  atendimentoIaExecucoesFerramentasTable,
  ({ many, one }) => ({
    execucao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaExecucoesFerramentasTable.execucaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
    auditorias: many(atendimentoIaAuditoriasTable),
  }),
);

export const atendimentoIaTransferenciasRelations = relations(
  atendimentoIaTransferenciasTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaTransferenciasTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    mensagemSolicitacao: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaTransferenciasTable.mensagemSolicitacaoId],
      references: [atendimentoIaMensagensTable.id],
    }),
  }),
);

export const atendimentoIaAvaliacoesRelations = relations(
  atendimentoIaAvaliacoesTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaAvaliacoesTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    mensagem: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaAvaliacoesTable.mensagemId],
      references: [atendimentoIaMensagensTable.id],
    }),
  }),
);

export const atendimentoIaOcorrenciasRelations = relations(
  atendimentoIaOcorrenciasTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaOcorrenciasTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    mensagem: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaOcorrenciasTable.mensagemId],
      references: [atendimentoIaMensagensTable.id],
    }),
    execucao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaOcorrenciasTable.execucaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
  }),
);

export const atendimentoIaAuditoriasRelations = relations(
  atendimentoIaAuditoriasTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaAuditoriasTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    mensagem: one(atendimentoIaMensagensTable, {
      fields: [atendimentoIaAuditoriasTable.mensagemId],
      references: [atendimentoIaMensagensTable.id],
    }),
    execucao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaAuditoriasTable.execucaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
    execucaoFerramenta: one(atendimentoIaExecucoesFerramentasTable, {
      fields: [atendimentoIaAuditoriasTable.execucaoFerramentaId],
      references: [atendimentoIaExecucoesFerramentasTable.id],
    }),
  }),
);

export const atendimentoIaIdempotenciasRelations = relations(
  atendimentoIaIdempotenciasTable,
  ({ one }) => ({
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaIdempotenciasTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
  }),
);
