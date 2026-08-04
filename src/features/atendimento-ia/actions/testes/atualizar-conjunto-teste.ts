"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaConjuntosTesteTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarConjuntoTesteSchema } from "../../schemas/admin/caso-teste.schema";
export async function atualizarConjuntoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const { conjuntoTesteId, atualizadoEmEsperado, ...d } =
    atualizarConjuntoTesteSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const [c] = await tx
      .update(atendimentoIaConjuntosTesteTable)
      .set({ ...d, atualizadoEm: new Date() })
      .where(
        and(
          eq(atendimentoIaConjuntosTesteTable.id, conjuntoTesteId),
          eq(
            atendimentoIaConjuntosTesteTable.atualizadoEm,
            atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaConjuntosTesteTable.id });
    if (!c) throw new Error("CONJUNTO_DESATUALIZADO");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "atualizar_conjunto_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conjunto_teste_atualizado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
