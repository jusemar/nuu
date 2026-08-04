"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarConteudoCanonicoConhecimento } from "../../lib/admin/conhecimento/montar-conteudo-canonico-conhecimento";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarRascunhoConhecimentoSchema } from "../../schemas/admin/editor-conhecimento.schema";

export async function atualizarRascunhoConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = atualizarRascunhoConhecimentoSchema.parse(entrada);

  await dbTransacional.transaction(async (transacao) => {
    const [registro] = await transacao
      .select({
        categoria: atendimentoIaDocumentosInstitucionaisTable.categoria,
        origem: atendimentoIaDocumentosInstitucionaisTable.origem,
        tipoConhecimento:
          atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
        tituloAdministrativo:
          atendimentoIaDocumentosInstitucionaisTable.tituloAdministrativo,
      })
      .from(atendimentoIaDocumentoVersoesTable)
      .innerJoin(
        atendimentoIaDocumentosInstitucionaisTable,
        eq(
          atendimentoIaDocumentoVersoesTable.documentoId,
          atendimentoIaDocumentosInstitucionaisTable.id,
        ),
      )
      .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
      .limit(1);

    if (!registro) throw new Error("VERSAO_NAO_ENCONTRADA");

    const canonico = montarConteudoCanonicoConhecimento({
      categoria: registro.categoria,
      conteudo: dados.conteudo,
      motivoAlteracao: dados.motivoAlteracao,
      origem: registro.origem,
      tipoConhecimento: registro.tipoConhecimento,
      tituloAdministrativo:
        registro.tituloAdministrativo ?? "Conhecimento sem título",
    } as Parameters<typeof montarConteudoCanonicoConhecimento>[0]);
    const agora = new Date();
    const [atualizada] = await transacao
      .update(atendimentoIaDocumentoVersoesTable)
      .set({
        atualizadoEm: agora,
        conteudo: canonico.conteudo,
        conteudoEstruturado: dados.conteudo,
        hashConteudo: canonico.hash,
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.resumoAlteracao,
      })
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "rascunho"),
          eq(
            atendimentoIaDocumentoVersoesTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaDocumentoVersoesTable.id });

    if (!atualizada) throw new Error("RASCUNHO_DESATUALIZADO_OU_NAO_EDITAVEL");

    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "editar_rascunho_conhecimento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_rascunho_conhecimento_atualizado",
      metadados: { versaoId: atualizada.id },
      resultado: "sucesso_comprovado",
    });
  });

  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
