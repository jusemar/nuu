import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaExecucoesLaboratorioTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarExecucaoLaboratorioAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [item] = await db
    .select()
    .from(atendimentoIaExecucoesLaboratorioTable)
    .where(eq(atendimentoIaExecucoesLaboratorioTable.id, id))
    .limit(1);
  return item ?? null;
}
