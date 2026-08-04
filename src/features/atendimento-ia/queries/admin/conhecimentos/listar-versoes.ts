import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaDocumentoVersoesTable } from "@/db/schema";
import { userTable } from "@/db/tables/autenticacao";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
export async function listarVersoesConhecimentoAdmin(documentoId: string) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const itens = await db
    .select({
      criadoEm: atendimentoIaDocumentoVersoesTable.criadoEm,
      criadoPor: userTable.name,
      atualizadoEm: atendimentoIaDocumentoVersoesTable.atualizadoEm,
      conteudo: atendimentoIaDocumentoVersoesTable.conteudo,
      conteudoEstruturado:
        atendimentoIaDocumentoVersoesTable.conteudoEstruturado,
      enviadoRevisaoEm: atendimentoIaDocumentoVersoesTable.enviadoRevisaoEm,
      estado: atendimentoIaDocumentoVersoesTable.estado,
      hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
      id: atendimentoIaDocumentoVersoesTable.id,
      indexacao: atendimentoIaDocumentoVersoesTable.statusIndexacao,
      motivoAlteracao: atendimentoIaDocumentoVersoesTable.motivoAlteracao,
      motivoBloqueio: atendimentoIaDocumentoVersoesTable.motivoBloqueio,
      publicacaoBloqueada:
        atendimentoIaDocumentoVersoesTable.publicacaoBloqueada,
      restauradaDeVersaoId:
        atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId,
      publicadoEm: atendimentoIaDocumentoVersoesTable.publicadoEm,
      titulo: atendimentoIaDocumentoVersoesTable.titulo,
      versao: atendimentoIaDocumentoVersoesTable.versao,
    })
    .from(atendimentoIaDocumentoVersoesTable)
    .leftJoin(
      userTable,
      eq(atendimentoIaDocumentoVersoesTable.criadoPorId, userTable.id),
    )
    .where(eq(atendimentoIaDocumentoVersoesTable.documentoId, documentoId))
    .orderBy(
      desc(atendimentoIaDocumentoVersoesTable.versao),
      desc(atendimentoIaDocumentoVersoesTable.id),
    );
  return itens.map((item) => ({
    ...item,
    atualizadoEm: item.atualizadoEm.toISOString(),
    criadoEm: item.criadoEm.toISOString(),
    enviadoRevisaoEm: item.enviadoRevisaoEm?.toISOString() ?? null,
    publicadoEm: item.publicadoEm?.toISOString() ?? null,
  }));
}
