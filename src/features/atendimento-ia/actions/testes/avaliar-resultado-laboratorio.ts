"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaResultadosLaboratorioTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { avaliarResultadoLaboratorioSchema } from "../../schemas/admin/laboratorio.schema";
export async function avaliarResultadoLaboratorio(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("avaliacoes_escrita");
  const d = avaliarResultadoLaboratorioSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const [x] = await tx
      .update(atendimentoIaResultadosLaboratorioTable)
      .set({
        decisaoHumana: d.decisao,
        comentarioAvaliador: d.comentario,
        avaliadorId: ator.usuarioId,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(atendimentoIaResultadosLaboratorioTable.id, d.resultadoId),
          eq(
            atendimentoIaResultadosLaboratorioTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaResultadosLaboratorioTable.id });
    if (!x) throw new Error("AVALIACAO_DESATUALIZADA");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "avaliar_resultado_laboratorio",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_laboratorio_avaliado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
