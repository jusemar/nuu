"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaDocumentoVersoesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { enviarRevisaoConhecimentoSchema } from "../../schemas/admin/editor-conhecimento.schema";

export async function enviarConhecimentoRevisao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = enviarRevisaoConhecimentoSchema.parse(entrada);

  await dbTransacional.transaction(async (transacao) => {
    const agora = new Date();
    const [enviada] = await transacao
      .update(atendimentoIaDocumentoVersoesTable)
      .set({
        atualizadoEm: agora,
        enviadoRevisaoEm: agora,
        enviadoRevisaoPorId: ator.usuarioId,
        estado: "em_revisao",
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

    if (!enviada) throw new Error("RASCUNHO_DESATUALIZADO_OU_NAO_EDITAVEL");

    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "enviar_conhecimento_revisao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conhecimento_enviado_revisao",
      metadados: { versaoId: enviada.id },
      resultado: "sucesso_comprovado",
    });
  });

  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
