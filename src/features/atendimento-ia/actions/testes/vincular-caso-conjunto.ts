"use server";
import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaConjuntoTesteCasosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { vincularCasoConjuntoSchema } from "../../schemas/admin/caso-teste.schema";
export async function vincularCasoConjunto(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = vincularCasoConjuntoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const [v] = await tx
      .select({ estado: atendimentoIaCasoTesteVersoesTable.estado })
      .from(atendimentoIaCasoTesteVersoesTable)
      .where(eq(atendimentoIaCasoTesteVersoesTable.id, d.casoTesteVersaoId))
      .limit(1);
    if (!v) throw new Error("VERSAO_NAO_ENCONTRADA");
    const [ultima] = await tx
      .select({ ordem: max(atendimentoIaConjuntoTesteCasosTable.ordem) })
      .from(atendimentoIaConjuntoTesteCasosTable)
      .where(
        eq(
          atendimentoIaConjuntoTesteCasosTable.conjuntoTesteId,
          d.conjuntoTesteId,
        ),
      );
    await tx
      .insert(atendimentoIaConjuntoTesteCasosTable)
      .values({ ...d, ordem: (ultima?.ordem ?? 0) + 1 });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "vincular_caso_conjunto",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_vinculado_conjunto",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
