import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaComportamentoVersoesTable } from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarVersoesComportamentoAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  return db
    .select({
      id: atendimentoIaComportamentoVersoesTable.id,
      numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
      estado: atendimentoIaComportamentoVersoesTable.estado,
      hash: atendimentoIaComportamentoVersoesTable.hash,
      configuracao:
        atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
      atualizadoEm: atendimentoIaComportamentoVersoesTable.atualizadoEm,
    })
    .from(atendimentoIaComportamentoVersoesTable)
    .where(eq(atendimentoIaComportamentoVersoesTable.comportamentoId, id))
    .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao));
}
