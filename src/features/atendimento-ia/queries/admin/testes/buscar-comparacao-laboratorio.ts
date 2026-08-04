import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaResultadosLaboratorioTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarComparacaoLaboratorioAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [resultado] = await db
    .select()
    .from(atendimentoIaResultadosLaboratorioTable)
    .where(eq(atendimentoIaResultadosLaboratorioTable.id, id))
    .limit(1);
  return resultado ?? null;
}
