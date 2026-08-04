import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaComportamentoVersoesTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarVersaoCandidataAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return (
    (
      await db
        .select({
          id: atendimentoIaComportamentoVersoesTable.id,
          estado: atendimentoIaComportamentoVersoesTable.estado,
          configuracao:
            atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
          atualizadoEm: atendimentoIaComportamentoVersoesTable.atualizadoEm,
        })
        .from(atendimentoIaComportamentoVersoesTable)
        .where(
          and(
            eq(atendimentoIaComportamentoVersoesTable.comportamentoId, id),
            inArray(atendimentoIaComportamentoVersoesTable.estado, [
              "rascunho",
              "em_revisao",
            ]),
          ),
        )
        .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
        .limit(1)
    )[0] ?? null
  );
}
