"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaComportamentoVersoesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { enviarComportamentoRevisaoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function enviarComportamentoRevisao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = enviarComportamentoRevisaoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const agora = new Date();
    const [v] = await tx
      .update(atendimentoIaComportamentoVersoesTable)
      .set({
        estado: "em_revisao",
        enviadoRevisaoEm: agora,
        enviadoRevisaoPorId: ator.usuarioId,
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(atendimentoIaComportamentoVersoesTable.id, d.versaoId),
          eq(atendimentoIaComportamentoVersoesTable.estado, "rascunho"),
          eq(
            atendimentoIaComportamentoVersoesTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaComportamentoVersoesTable.id });
    if (!v) throw new Error("RASCUNHO_DESATUALIZADO");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "enviar_comportamento_revisao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_enviado_revisao",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
