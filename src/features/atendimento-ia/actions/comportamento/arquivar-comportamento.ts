"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaComportamentosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { arquivarComportamentoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function arquivarComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = arquivarComportamentoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    await tx
      .update(atendimentoIaComportamentosTable)
      .set({ situacao: "arquivada", atualizadoEm: new Date() })
      .where(eq(atendimentoIaComportamentosTable.id, d.comportamentoId));
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "arquivar_comportamento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_arquivado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
