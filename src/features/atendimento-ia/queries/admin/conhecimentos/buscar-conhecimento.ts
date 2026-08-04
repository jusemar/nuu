import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaDocumentosInstitucionaisTable } from "@/db/schema";
import { userTable } from "@/db/tables/autenticacao";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarConhecimentoAdmin(id: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const [item] = await db
    .select({
      atualizadoEm: atendimentoIaDocumentosInstitucionaisTable.atualizadoEm,
      autor: userTable.name,
      categoria: atendimentoIaDocumentosInstitucionaisTable.categoria,
      chaveEstavel: atendimentoIaDocumentosInstitucionaisTable.chaveEstavel,
      id: atendimentoIaDocumentosInstitucionaisTable.id,
      origem: atendimentoIaDocumentosInstitucionaisTable.origem,
      situacao: atendimentoIaDocumentosInstitucionaisTable.situacao,
      tipoConhecimento:
        atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
      tituloAdministrativo:
        atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
    })
    .from(atendimentoIaDocumentosInstitucionaisTable)
    .leftJoin(
      userTable,
      eq(atendimentoIaDocumentosInstitucionaisTable.criadoPorId, userTable.id),
    )
    .where(eq(atendimentoIaDocumentosInstitucionaisTable.id, id))
    .limit(1);
  return item
    ? { ...item, atualizadoEm: item.atualizadoEm.toISOString() }
    : null;
}
