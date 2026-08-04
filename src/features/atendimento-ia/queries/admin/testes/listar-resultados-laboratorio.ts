import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaResultadosLaboratorioTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarResultadosLaboratorioAdmin(execucaoId: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return db
    .select()
    .from(atendimentoIaResultadosLaboratorioTable)
    .where(
      eq(
        atendimentoIaResultadosLaboratorioTable.execucaoLaboratorioId,
        execucaoId,
      ),
    )
    .orderBy(asc(atendimentoIaResultadosLaboratorioTable.criadoEm))
    .limit(100);
}
