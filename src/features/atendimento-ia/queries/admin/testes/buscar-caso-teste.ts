import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarCasoTesteAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [caso] = await db
    .select()
    .from(atendimentoIaCasosTesteTable)
    .where(eq(atendimentoIaCasosTesteTable.id, id))
    .limit(1);
  if (!caso) return null;
  const versoes = await db
    .select()
    .from(atendimentoIaCasoTesteVersoesTable)
    .where(eq(atendimentoIaCasoTesteVersoesTable.casoTesteId, id))
    .orderBy(desc(atendimentoIaCasoTesteVersoesTable.numeroVersao));
  return { ...caso, versoes };
}
