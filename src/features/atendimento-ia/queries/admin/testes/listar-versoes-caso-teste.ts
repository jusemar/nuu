import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaCasoTesteVersoesTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarVersoesCasoTesteAdmin(casoTesteId: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return db
    .select()
    .from(atendimentoIaCasoTesteVersoesTable)
    .where(eq(atendimentoIaCasoTesteVersoesTable.casoTesteId, casoTesteId))
    .orderBy(desc(atendimentoIaCasoTesteVersoesTable.numeroVersao));
}
