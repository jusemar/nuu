"use server";
import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarConteudoCanonicoConhecimento } from "../../lib/admin/conhecimento/montar-conteudo-canonico-conhecimento";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarConhecimentoEditorSchema } from "../../schemas/admin/editor-conhecimento.schema";

export async function criarConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  if (!ator) throw new Error("ACESSO_NEGADO");
  const dados = criarConhecimentoEditorSchema.parse(entrada);
  const canonico = montarConteudoCanonicoConhecimento(dados);
  const id = await dbTransacional.transaction(async (tx) => {
    const [documento] = await tx
      .insert(atendimentoIaDocumentosInstitucionaisTable)
      .values({
        categoria: dados.categoria,
        chaveEstavel: `${dados.tipoConhecimento}-${randomUUID()}`,
        criadoPorId: ator.usuarioId,
        origem: dados.origem,
        situacao: "ativa",
        tipoConhecimento: dados.tipoConhecimento,
        tituloAdministrativo: dados.tituloAdministrativo,
      })
      .returning({ id: atendimentoIaDocumentosInstitucionaisTable.id });
    if (!documento) throw new Error("FALHA_CRIAR_CONHECIMENTO");
    await tx
      .insert(atendimentoIaDocumentoVersoesTable)
      .values({
        conteudo: canonico.conteudo,
        conteudoEstruturado: dados.conteudo,
        criadoPorId: ator.usuarioId,
        documentoId: documento.id,
        estado: "rascunho",
        hashConteudo: canonico.hash,
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.motivoAlteracao,
        statusIndexacao: "pendente",
        titulo: dados.tituloAdministrativo,
        versao: 1,
      });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_conhecimento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conhecimento_criado",
      metadados: { tipoConhecimento: dados.tipoConhecimento },
      resultado: "sucesso_comprovado",
      usuarioId: ator.usuarioId,
    });
    return documento.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { id, sucesso: true as const };
}
