import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaConjuntosTesteTable,
  atendimentoIaConjuntoTesteCasosTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarConjuntosTesteAdmin() {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const conjuntos = await db
    .select()
    .from(atendimentoIaConjuntosTesteTable)
    .orderBy(desc(atendimentoIaConjuntosTesteTable.atualizadoEm))
    .limit(100);
  return Promise.all(
    conjuntos.map(async (conjunto) => ({
      ...conjunto,
      criadoEm: conjunto.criadoEm.toISOString(),
      atualizadoEm: conjunto.atualizadoEm.toISOString(),
      casos: await db
        .select()
        .from(atendimentoIaConjuntoTesteCasosTable)
        .where(
          eq(atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId, conjunto.id),
        )
        .orderBy(asc(atendimentoIaConjuntoTesteCasosTable.ordem)),
    })),
  );
}
