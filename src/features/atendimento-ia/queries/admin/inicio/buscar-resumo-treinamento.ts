import "server-only";

import { count, gte } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaAvaliacoesTable,
  atendimentoIaConversasTable,
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarResumoTreinamento() {
  await exigirCapacidadeAtendimentoIa("modulo_visualizar");
  const desde = new Date(Date.now() - 30 * 86_400_000);
  const [
    conversas,
    avaliacoes,
    transferencias,
    ocorrencias,
    conhecimentos,
    versoes,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(atendimentoIaConversasTable)
      .where(gte(atendimentoIaConversasTable.criadoEm, desde)),
    db
      .select({ total: count() })
      .from(atendimentoIaAvaliacoesTable)
      .where(gte(atendimentoIaAvaliacoesTable.criadoEm, desde)),
    db
      .select({ total: count() })
      .from(atendimentoIaTransferenciasTable)
      .where(gte(atendimentoIaTransferenciasTable.criadoEm, desde)),
    db
      .select({ total: count() })
      .from(atendimentoIaOcorrenciasTable)
      .where(gte(atendimentoIaOcorrenciasTable.criadoEm, desde)),
    db
      .select({ total: count() })
      .from(atendimentoIaDocumentosInstitucionaisTable),
    db.select({ total: count() }).from(atendimentoIaDocumentoVersoesTable),
  ]);
  return {
    alertasOperacionais: ocorrencias[0]?.total ?? 0,
    avaliacoes: avaliacoes[0]?.total ?? 0,
    conhecimentos: conhecimentos[0]?.total ?? 0,
    ocorrencias: ocorrencias[0]?.total ?? 0,
    periodoDias: 30,
    totalConversas: conversas[0]?.total ?? 0,
    transferencias: transferencias[0]?.total ?? 0,
    versoes: versoes[0]?.total ?? 0,
  };
}
