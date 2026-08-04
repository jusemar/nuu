import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarCasosTesteAdmin() {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const casos = await db
    .select()
    .from(atendimentoIaCasosTesteTable)
    .orderBy(desc(atendimentoIaCasosTesteTable.atualizadoEm))
    .limit(100);
  return Promise.all(
    casos.map(async (caso) => {
      const [versao] = await db
        .select()
        .from(atendimentoIaCasoTesteVersoesTable)
        .where(eq(atendimentoIaCasoTesteVersoesTable.casoTesteId, caso.id))
        .orderBy(desc(atendimentoIaCasoTesteVersoesTable.numeroVersao))
        .limit(1);
      return {
        ...caso,
        criadoEm: caso.criadoEm.toISOString(),
        atualizadoEm: caso.atualizadoEm.toISOString(),
        versao: versao
          ? {
              ...versao,
              criadoEm: versao.criadoEm.toISOString(),
              atualizadoEm: versao.atualizadoEm.toISOString(),
              enviadoRevisaoEm: versao.enviadoRevisaoEm?.toISOString() ?? null,
              revisadoEm: versao.revisadoEm?.toISOString() ?? null,
            }
          : null,
      };
    }),
  );
}
