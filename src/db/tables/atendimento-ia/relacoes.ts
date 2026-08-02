import { relations } from "drizzle-orm";

import { userTable } from "../autenticacao";
import {
  atendimentoIaBuscasRagTable,
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaFragmentosInstitucionaisTable,
  atendimentoIaResultadosRagTable,
} from "./tabelas/conhecimento";
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
import {
  atendimentoIaConfirmacoesFerramentasTable,
  atendimentoIaOperacoesProtegidasTable,
} from "./tabelas/protecao-ferramentas";

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
    confirmacoesFerramentas: many(atendimentoIaConfirmacoesFerramentasTable),
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
    confirmacoesSolicitadas: many(atendimentoIaConfirmacoesFerramentasTable),
    operacoesProtegidas: many(atendimentoIaOperacoesProtegidasTable),
    transferenciasSolicitadas: many(atendimentoIaTransferenciasTable),
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
    usuario: one(userTable, {
      fields: [atendimentoIaTransferenciasTable.usuarioId],
      references: [userTable.id],
    }),
    execucaoSolicitacao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaTransferenciasTable.execucaoSolicitacaoId],
      references: [atendimentoIaExecucoesTable.id],
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

export const atendimentoIaConfirmacoesFerramentasRelations = relations(
  atendimentoIaConfirmacoesFerramentasTable,
  ({ many, one }) => ({
    usuario: one(userTable, {
      fields: [atendimentoIaConfirmacoesFerramentasTable.usuarioId],
      references: [userTable.id],
    }),
    conversa: one(atendimentoIaConversasTable, {
      fields: [atendimentoIaConfirmacoesFerramentasTable.conversaId],
      references: [atendimentoIaConversasTable.id],
    }),
    execucaoSolicitacao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaConfirmacoesFerramentasTable.execucaoSolicitacaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
    operacoes: many(atendimentoIaOperacoesProtegidasTable),
  }),
);

export const atendimentoIaOperacoesProtegidasRelations = relations(
  atendimentoIaOperacoesProtegidasTable,
  ({ one }) => ({
    confirmacao: one(atendimentoIaConfirmacoesFerramentasTable, {
      fields: [atendimentoIaOperacoesProtegidasTable.confirmacaoId],
      references: [atendimentoIaConfirmacoesFerramentasTable.id],
    }),
    execucao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaOperacoesProtegidasTable.execucaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
  }),
);

export const atendimentoIaDocumentosInstitucionaisRelations = relations(
  atendimentoIaDocumentosInstitucionaisTable,
  ({ many }) => ({ versoes: many(atendimentoIaDocumentoVersoesTable) }),
);

export const atendimentoIaDocumentoVersoesRelations = relations(
  atendimentoIaDocumentoVersoesTable,
  ({ many, one }) => ({
    documento: one(atendimentoIaDocumentosInstitucionaisTable, {
      fields: [atendimentoIaDocumentoVersoesTable.documentoId],
      references: [atendimentoIaDocumentosInstitucionaisTable.id],
    }),
    responsavelRevisao: one(userTable, {
      fields: [atendimentoIaDocumentoVersoesTable.responsavelRevisaoId],
      references: [userTable.id],
    }),
    versaoAnterior: one(atendimentoIaDocumentoVersoesTable, {
      fields: [atendimentoIaDocumentoVersoesTable.versaoAnteriorId],
      references: [atendimentoIaDocumentoVersoesTable.id],
      relationName: "versao_institucional_anterior",
    }),
    fragmentos: many(atendimentoIaFragmentosInstitucionaisTable),
  }),
);

export const atendimentoIaFragmentosInstitucionaisRelations = relations(
  atendimentoIaFragmentosInstitucionaisTable,
  ({ many, one }) => ({
    versaoDocumento: one(atendimentoIaDocumentoVersoesTable, {
      fields: [atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId],
      references: [atendimentoIaDocumentoVersoesTable.id],
    }),
    resultados: many(atendimentoIaResultadosRagTable),
  }),
);

export const atendimentoIaBuscasRagRelations = relations(
  atendimentoIaBuscasRagTable,
  ({ many, one }) => ({
    execucao: one(atendimentoIaExecucoesTable, {
      fields: [atendimentoIaBuscasRagTable.execucaoId],
      references: [atendimentoIaExecucoesTable.id],
    }),
    resultados: many(atendimentoIaResultadosRagTable),
  }),
);

export const atendimentoIaResultadosRagRelations = relations(
  atendimentoIaResultadosRagTable,
  ({ one }) => ({
    busca: one(atendimentoIaBuscasRagTable, {
      fields: [atendimentoIaResultadosRagTable.buscaId],
      references: [atendimentoIaBuscasRagTable.id],
    }),
    fragmento: one(atendimentoIaFragmentosInstitucionaisTable, {
      fields: [atendimentoIaResultadosRagTable.fragmentoId],
      references: [atendimentoIaFragmentosInstitucionaisTable.id],
    }),
  }),
);
