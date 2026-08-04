import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaDocumentoVersoesTable } from "@/db/schema";

import { compararVersoesConhecimento } from "../../../lib/admin/conhecimento/comparar-versoes";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function compararVersoesConhecimentoAdmin(
  documentoId: string,
  versaoAnteriorId: string,
  versaoCandidataId: string,
) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const versoes = await db
    .select({
      conteudo: atendimentoIaDocumentoVersoesTable.conteudo,
      id: atendimentoIaDocumentoVersoesTable.id,
      versao: atendimentoIaDocumentoVersoesTable.versao,
    })
    .from(atendimentoIaDocumentoVersoesTable)
    .where(
      and(
        eq(atendimentoIaDocumentoVersoesTable.documentoId, documentoId),
        inArray(atendimentoIaDocumentoVersoesTable.id, [
          versaoAnteriorId,
          versaoCandidataId,
        ]),
      ),
    );
  const anterior = versoes.find((item) => item.id === versaoAnteriorId);
  const candidata = versoes.find((item) => item.id === versaoCandidataId);
  if (!anterior || !candidata) throw new Error("VERSAO_NAO_ENCONTRADA");
  return {
    ...compararVersoesConhecimento(anterior.conteudo, candidata.conteudo),
    versaoAnterior: anterior.versao,
    versaoCandidata: candidata.versao,
  };
}
