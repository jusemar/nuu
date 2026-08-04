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
  atendimentoIaPropostaEvidenciasTable,
  atendimentoIaPropostasMelhoriaTable,
  atendimentoIaRevisoesTable,
  atendimentoIaTransferenciasTable,
} from "./tabelas/governanca";
import {
  atendimentoIaExecucoesLaboratorioTable,
  atendimentoIaResultadosLaboratorioTable,
} from "./tabelas/laboratorio";
import {
  atendimentoIaExecucoesFerramentasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaIdempotenciasTable,
} from "./tabelas/operacoes";
import { atendimentoIaPapeisAdminTable } from "./tabelas/permissoes-admin";
import {
  atendimentoIaConfirmacoesFerramentasTable,
  atendimentoIaOperacoesProtegidasTable,
} from "./tabelas/protecao-ferramentas";
import {
  atendimentoIaPublicacaoItensTable,
  atendimentoIaPublicacoesTable,
} from "./tabelas/publicacoes";
import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaConjuntosTesteTable,
  atendimentoIaConjuntoTesteCasosTable,
} from "./tabelas/testes";

export const atendimentoIaExecucoesLaboratorioRelations = relations(
  atendimentoIaExecucoesLaboratorioTable,
  ({ many, one }) => ({
    solicitadoPor: one(userTable, {
      fields: [atendimentoIaExecucoesLaboratorioTable.solicitadoPorId],
      references: [userTable.id],
    }),
    resultados: many(atendimentoIaResultadosLaboratorioTable),
  }),
);
export const atendimentoIaResultadosLaboratorioRelations = relations(
  atendimentoIaResultadosLaboratorioTable,
  ({ one }) => ({
    execucao: one(atendimentoIaExecucoesLaboratorioTable, {
      fields: [atendimentoIaResultadosLaboratorioTable.execucaoLaboratorioId],
      references: [atendimentoIaExecucoesLaboratorioTable.id],
    }),
    caso: one(atendimentoIaCasoTesteVersoesTable, {
      fields: [atendimentoIaResultadosLaboratorioTable.casoTesteVersaoId],
      references: [atendimentoIaCasoTesteVersoesTable.id],
    }),
  }),
);

export const atendimentoIaPublicacoesRelations = relations(
  atendimentoIaPublicacoesTable,
  ({ many, one }) => ({
    itens: many(atendimentoIaPublicacaoItensTable),
    publicadoPor: one(userTable, {
      fields: [atendimentoIaPublicacoesTable.publicadoPorId],
      references: [userTable.id],
    }),
  }),
);

export const atendimentoIaPublicacaoItensRelations = relations(
  atendimentoIaPublicacaoItensTable,
  ({ one }) => ({
    publicacao: one(atendimentoIaPublicacoesTable, {
      fields: [atendimentoIaPublicacaoItensTable.publicacaoId],
      references: [atendimentoIaPublicacoesTable.id],
    }),
  }),
);

export const atendimentoIaCasosTesteRelations = relations(
  atendimentoIaCasosTesteTable,
  ({ many, one }) => ({
    criadoPor: one(userTable, {
      fields: [atendimentoIaCasosTesteTable.criadoPorId],
      references: [userTable.id],
    }),
    versoes: many(atendimentoIaCasoTesteVersoesTable),
  }),
);
export const atendimentoIaCasoTesteVersoesRelations = relations(
  atendimentoIaCasoTesteVersoesTable,
  ({ many, one }) => ({
    caso: one(atendimentoIaCasosTesteTable, {
      fields: [atendimentoIaCasoTesteVersoesTable.casoTesteId],
      references: [atendimentoIaCasosTesteTable.id],
    }),
    vinculos: many(atendimentoIaConjuntoTesteCasosTable),
  }),
);
export const atendimentoIaConjuntosTesteRelations = relations(
  atendimentoIaConjuntosTesteTable,
  ({ many }) => ({ casos: many(atendimentoIaConjuntoTesteCasosTable) }),
);
export const atendimentoIaConjuntoTesteCasosRelations = relations(
  atendimentoIaConjuntoTesteCasosTable,
  ({ one }) => ({
    conjunto: one(atendimentoIaConjuntosTesteTable, {
      fields: [atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId],
      references: [atendimentoIaConjuntosTesteTable.id],
    }),
    versao: one(atendimentoIaCasoTesteVersoesTable, {
      fields: [atendimentoIaConjuntoTesteCasosTable.casoTesteVersaoId],
      references: [atendimentoIaCasoTesteVersoesTable.id],
    }),
  }),
);

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
    proposta: one(atendimentoIaPropostasMelhoriaTable, {
      fields: [atendimentoIaAvaliacoesTable.propostaMelhoriaId],
      references: [atendimentoIaPropostasMelhoriaTable.id],
    }),
  }),
);

export const atendimentoIaPropostasMelhoriaRelations = relations(
  atendimentoIaPropostasMelhoriaTable,
  ({ many, one }) => ({
    criadoPor: one(userTable, {
      fields: [atendimentoIaPropostasMelhoriaTable.criadoPorId],
      references: [userTable.id],
      relationName: "proposta_melhoria_criada_por",
    }),
    evidencias: many(atendimentoIaPropostaEvidenciasTable),
    responsavel: one(userTable, {
      fields: [atendimentoIaPropostasMelhoriaTable.responsavelId],
      references: [userTable.id],
      relationName: "proposta_melhoria_responsavel",
    }),
    revisoes: many(atendimentoIaRevisoesTable),
  }),
);

export const atendimentoIaPropostaEvidenciasRelations = relations(
  atendimentoIaPropostaEvidenciasTable,
  ({ one }) => ({
    criadoPor: one(userTable, {
      fields: [atendimentoIaPropostaEvidenciasTable.criadoPorId],
      references: [userTable.id],
      relationName: "evidencia_proposta_criada_por",
    }),
    proposta: one(atendimentoIaPropostasMelhoriaTable, {
      fields: [atendimentoIaPropostaEvidenciasTable.propostaId],
      references: [atendimentoIaPropostasMelhoriaTable.id],
    }),
  }),
);

export const atendimentoIaRevisoesRelations = relations(
  atendimentoIaRevisoesTable,
  ({ one }) => ({
    avaliacao: one(atendimentoIaAvaliacoesTable, {
      fields: [atendimentoIaRevisoesTable.avaliacaoId],
      references: [atendimentoIaAvaliacoesTable.id],
    }),
    proposta: one(atendimentoIaPropostasMelhoriaTable, {
      fields: [atendimentoIaRevisoesTable.propostaId],
      references: [atendimentoIaPropostasMelhoriaTable.id],
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

export const atendimentoIaPapeisAdminRelations = relations(
  atendimentoIaPapeisAdminTable,
  ({ one }) => ({
    usuario: one(userTable, {
      fields: [atendimentoIaPapeisAdminTable.usuarioId],
      references: [userTable.id],
      relationName: "papel_atendimento_ia_usuario",
    }),
    atribuidoPor: one(userTable, {
      fields: [atendimentoIaPapeisAdminTable.atribuidoPorId],
      references: [userTable.id],
      relationName: "papel_atendimento_ia_atribuidor",
    }),
    revogadoPor: one(userTable, {
      fields: [atendimentoIaPapeisAdminTable.revogadoPorId],
      references: [userTable.id],
      relationName: "papel_atendimento_ia_revogador",
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
  ({ many, one }) => ({
    criadoPor: one(userTable, {
      fields: [atendimentoIaDocumentosInstitucionaisTable.criadoPorId],
      references: [userTable.id],
      relationName: "conhecimento_criado_por",
    }),
    versoes: many(atendimentoIaDocumentoVersoesTable),
  }),
);

export const atendimentoIaDocumentoVersoesRelations = relations(
  atendimentoIaDocumentoVersoesTable,
  ({ many, one }) => ({
    criadoPor: one(userTable, {
      fields: [atendimentoIaDocumentoVersoesTable.criadoPorId],
      references: [userTable.id],
      relationName: "versao_conhecimento_criada_por",
    }),
    documento: one(atendimentoIaDocumentosInstitucionaisTable, {
      fields: [atendimentoIaDocumentoVersoesTable.documentoId],
      references: [atendimentoIaDocumentosInstitucionaisTable.id],
    }),
    responsavelRevisao: one(userTable, {
      fields: [atendimentoIaDocumentoVersoesTable.responsavelRevisaoId],
      references: [userTable.id],
    }),
    enviadoRevisaoPor: one(userTable, {
      fields: [atendimentoIaDocumentoVersoesTable.enviadoRevisaoPorId],
      references: [userTable.id],
      relationName: "versao_conhecimento_enviada_revisao_por",
    }),
    reprovadoPor: one(userTable, {
      fields: [atendimentoIaDocumentoVersoesTable.reprovadoPorId],
      references: [userTable.id],
      relationName: "versao_conhecimento_reprovada_por",
    }),
    restauradaDeVersao: one(atendimentoIaDocumentoVersoesTable, {
      fields: [atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId],
      references: [atendimentoIaDocumentoVersoesTable.id],
      relationName: "versao_institucional_restaurada_de",
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
