"use server";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { prepararVersaoConhecimento } from "../../lib/admin/conhecimento/preparar-versao-conhecimento";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarVersaoConhecimentoSchema } from "../../schemas/admin/editor-conhecimento.schema";

export async function criarVersaoConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  if (!ator) throw new Error("ACESSO_NEGADO");
  const dados = criarVersaoConhecimentoSchema.parse(entrada);
  const id = await dbTransacional.transaction(async (tx) => {
    const [documento] = await tx
      .select({
        categoria: atendimentoIaDocumentosInstitucionaisTable.categoria,
        origem: atendimentoIaDocumentosInstitucionaisTable.origem,
        tipo: atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
        titulo: atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
      })
      .from(atendimentoIaDocumentosInstitucionaisTable)
      .where(
        eq(atendimentoIaDocumentosInstitucionaisTable.id, dados.conhecimentoId),
      )
      .limit(1);
    if (!documento) throw new Error("CONHECIMENTO_NAO_ENCONTRADO");
    // Serializa a numeração somente deste conhecimento, sem bloquear os demais.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${dados.conhecimentoId}))`,
    );
    const [ultima] = await tx
      .select({ versao: atendimentoIaDocumentoVersoesTable.versao })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(
        eq(
          atendimentoIaDocumentoVersoesTable.documentoId,
          dados.conhecimentoId,
        ),
      )
      .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
      .limit(1);
    const canonico = prepararVersaoConhecimento(documento.tipo, dados, {
      categoria: documento.categoria,
      origem: documento.origem,
      tituloAdministrativo: documento.titulo ?? "Conhecimento",
    });
    const [versao] = await tx
      .insert(atendimentoIaDocumentoVersoesTable)
      .values({
        conteudo: canonico.conteudo,
        conteudoEstruturado: dados.conteudo,
        criadoPorId: ator.usuarioId,
        documentoId: dados.conhecimentoId,
        estado: "rascunho",
        hashConteudo: canonico.hash,
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.resumoAlteracao,
        statusIndexacao: "pendente",
        titulo: documento.titulo ?? "Conhecimento",
        versao: (ultima?.versao ?? 0) + 1,
      })
      .returning({ id: atendimentoIaDocumentoVersoesTable.id });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_versao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_versao_conhecimento_criada",
      resultado: "sucesso_comprovado",
      usuarioId: ator.usuarioId,
    });
    return versao!.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { id, sucesso: true as const };
}
