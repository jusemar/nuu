"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaConjuntoTesteCasosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { removerCasoConjuntoSchema } from "../../schemas/admin/caso-teste.schema";
export async function removerCasoConjunto(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = removerCasoConjuntoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    await tx
      .delete(atendimentoIaConjuntoTesteCasosTable)
      .where(eq(atendimentoIaConjuntoTesteCasosTable.id, d.vinculoId));
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "remover_caso_conjunto",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_removido_conjunto",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
