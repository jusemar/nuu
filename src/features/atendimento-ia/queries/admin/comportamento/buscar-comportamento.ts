import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaComportamentosTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function buscarComportamentoAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return (
    (
      await db
        .select({
          id: atendimentoIaComportamentosTable.id,
          nome: atendimentoIaComportamentosTable.nome,
          descricao: atendimentoIaComportamentosTable.descricao,
          situacao: atendimentoIaComportamentosTable.situacao,
        })
        .from(atendimentoIaComportamentosTable)
        .where(eq(atendimentoIaComportamentosTable.id, id))
        .limit(1)
    )[0] ?? null
  );
}
