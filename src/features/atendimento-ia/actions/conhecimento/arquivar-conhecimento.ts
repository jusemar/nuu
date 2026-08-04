"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaDocumentosInstitucionaisTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { conhecimentoIdSchema } from "../../schemas/admin/editor-conhecimento.schema";

export async function arquivarConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = conhecimentoIdSchema.parse(entrada);

  await dbTransacional.transaction(async (transacao) => {
    const [arquivado] = await transacao
      .update(atendimentoIaDocumentosInstitucionaisTable)
      .set({ atualizadoEm: new Date(), situacao: "arquivada" })
      .where(
        and(
          eq(
            atendimentoIaDocumentosInstitucionaisTable.id,
            dados.conhecimentoId,
          ),
          eq(atendimentoIaDocumentosInstitucionaisTable.situacao, "ativa"),
        ),
      )
      .returning({ id: atendimentoIaDocumentosInstitucionaisTable.id });

    if (!arquivado) throw new Error("CONHECIMENTO_NAO_ENCONTRADO_OU_ARQUIVADO");

    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "arquivar_conhecimento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conhecimento_arquivado",
      metadados: { conhecimentoId: arquivado.id },
      resultado: "sucesso_comprovado",
    });
  });

  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
