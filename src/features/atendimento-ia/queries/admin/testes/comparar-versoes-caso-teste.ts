import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaCasoTesteVersoesTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function compararVersoesCasoTesteAdmin(ids: [string, string]) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const versoes = await db
    .select()
    .from(atendimentoIaCasoTesteVersoesTable)
    .where(inArray(atendimentoIaCasoTesteVersoesTable.id, ids));
  if (
    versoes.length !== 2 ||
    versoes[0]!.casoTesteId !== versoes[1]!.casoTesteId
  )
    throw new Error("VERSOES_INCOMPATIVEIS");
  return {
    anterior: versoes.find((v) => v.id === ids[0])!,
    candidata: versoes.find((v) => v.id === ids[1])!,
  };
}
