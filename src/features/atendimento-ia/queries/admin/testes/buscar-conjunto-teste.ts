import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaConjuntosTesteTable,
  atendimentoIaConjuntoTesteCasosTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarConjuntoTesteAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [conjunto] = await db
    .select()
    .from(atendimentoIaConjuntosTesteTable)
    .where(eq(atendimentoIaConjuntosTesteTable.id, id))
    .limit(1);
  if (!conjunto) return null;
  const casos = await db
    .select()
    .from(atendimentoIaConjuntoTesteCasosTable)
    .where(eq(atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId, id))
    .orderBy(asc(atendimentoIaConjuntoTesteCasosTable.ordem));
  return { ...conjunto, casos };
}
