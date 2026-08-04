import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaComportamentoVersoesTable } from "@/db/schema";

import { compararComportamentos } from "../../../lib/admin/comportamento/comparar-comportamentos";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function compararVersoesComportamentoAdmin(ids: [string, string]) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const v = await db
    .select({
      id: atendimentoIaComportamentoVersoesTable.id,
      config: atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
    })
    .from(atendimentoIaComportamentoVersoesTable)
    .where(inArray(atendimentoIaComportamentoVersoesTable.id, ids));
  if (v.length !== 2) throw new Error("VERSAO_NAO_DISPONIVEL");
  return compararComportamentos(
    v.find((x) => x.id === ids[0])!.config,
    v.find((x) => x.id === ids[1])!.config,
  );
}
