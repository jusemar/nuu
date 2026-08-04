"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaConjuntoTesteCasosTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { reordenarCasosConjuntoSchema } from "../../schemas/admin/caso-teste.schema";
export async function reordenarCasosConjunto(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = reordenarCasosConjuntoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    // Impede duas ordenações simultâneas de deixarem uma sequência híbrida.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${d.conjuntoTesteId}))`,
    );
    const atuais = await tx
      .select({ id: atendimentoIaConjuntoTesteCasosTable.id })
      .from(atendimentoIaConjuntoTesteCasosTable)
      .where(
        and(
          eq(
            atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId,
            d.conjuntoTesteId,
          ),
          inArray(atendimentoIaConjuntoTesteCasosTable.id, d.vinculosOrdenados),
        ),
      );
    if (atuais.length !== d.vinculosOrdenados.length)
      throw new Error("ORDEM_CONTEM_VINCULO_INVALIDO");
    for (let indice = 0; indice < d.vinculosOrdenados.length; indice++)
      await tx
        .update(atendimentoIaConjuntoTesteCasosTable)
        .set({ ordem: -(indice + 1) })
        .where(
          eq(
            atendimentoIaConjuntoTesteCasosTable.id,
            d.vinculosOrdenados[indice]!,
          ),
        );
    for (let indice = 0; indice < d.vinculosOrdenados.length; indice++)
      await tx
        .update(atendimentoIaConjuntoTesteCasosTable)
        .set({ ordem: indice + 1 })
        .where(
          eq(
            atendimentoIaConjuntoTesteCasosTable.id,
            d.vinculosOrdenados[indice]!,
          ),
        );
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "reordenar_casos_conjunto",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conjunto_teste_reordenado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
