import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaExecucoesLaboratorioTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarExecucoesLaboratorioAdmin() {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return db
    .select()
    .from(atendimentoIaExecucoesLaboratorioTable)
    .orderBy(desc(atendimentoIaExecucoesLaboratorioTable.criadoEm))
    .limit(50);
}
