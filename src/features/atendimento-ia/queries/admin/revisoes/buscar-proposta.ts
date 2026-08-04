import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaPropostaEvidenciasTable,
  atendimentoIaPropostasMelhoriaTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarPropostaAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [proposta] = await db
    .select({
      atualizadoEm: atendimentoIaPropostasMelhoriaTable.atualizadoEm,
      categoria: atendimentoIaPropostasMelhoriaTable.categoria,
      criterioAceite: atendimentoIaPropostasMelhoriaTable.criterioAceite,
      descricao: atendimentoIaPropostasMelhoriaTable.descricao,
      id: atendimentoIaPropostasMelhoriaTable.id,
      impacto: atendimentoIaPropostasMelhoriaTable.impacto,
      prioridade: atendimentoIaPropostasMelhoriaTable.prioridade,
      risco: atendimentoIaPropostasMelhoriaTable.risco,
      status: atendimentoIaPropostasMelhoriaTable.status,
      titulo: atendimentoIaPropostasMelhoriaTable.titulo,
    })
    .from(atendimentoIaPropostasMelhoriaTable)
    .where(eq(atendimentoIaPropostasMelhoriaTable.id, id))
    .limit(1);
  if (!proposta) return null;
  const evidencias = await db
    .select({
      criadoEm: atendimentoIaPropostaEvidenciasTable.criadoEm,
      data: atendimentoIaPropostaEvidenciasTable.dataEvidencia,
      descricao: atendimentoIaPropostaEvidenciasTable.descricaoSanitizada,
      id: atendimentoIaPropostaEvidenciasTable.id,
      referenciaId: atendimentoIaPropostaEvidenciasTable.referenciaId,
      tipo: atendimentoIaPropostaEvidenciasTable.tipo,
    })
    .from(atendimentoIaPropostaEvidenciasTable)
    .where(eq(atendimentoIaPropostaEvidenciasTable.propostaId, id))
    .orderBy(asc(atendimentoIaPropostaEvidenciasTable.criadoEm));
  return {
    ...proposta,
    atualizadoEm: proposta.atualizadoEm.toISOString(),
    evidencias: evidencias.map((item) => ({
      ...item,
      criadoEm: item.criadoEm.toISOString(),
      data: item.data.toISOString(),
    })),
  };
}
