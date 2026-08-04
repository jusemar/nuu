import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaRevisoesTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarRevisaoFormalAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [item] = await db
    .select({
      atualizadoEm: atendimentoIaRevisoesTable.atualizadoEm,
      autorId: atendimentoIaRevisoesTable.autorId,
      avaliacaoId: atendimentoIaRevisoesTable.avaliacaoId,
      decididoEm: atendimentoIaRevisoesTable.decididoEm,
      decisaoJustificativa: atendimentoIaRevisoesTable.decisaoJustificativa,
      id: atendimentoIaRevisoesTable.id,
      propostaId: atendimentoIaRevisoesTable.propostaId,
      responsavelId: atendimentoIaRevisoesTable.responsavelId,
      status: atendimentoIaRevisoesTable.status,
      versao: atendimentoIaRevisoesTable.versao,
    })
    .from(atendimentoIaRevisoesTable)
    .where(eq(atendimentoIaRevisoesTable.id, id))
    .limit(1);
  return item
    ? {
        ...item,
        atualizadoEm: item.atualizadoEm.toISOString(),
        decididoEm: item.decididoEm?.toISOString() ?? null,
      }
    : null;
}
