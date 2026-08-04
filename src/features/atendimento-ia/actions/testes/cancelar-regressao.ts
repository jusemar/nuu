"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaExecucoesLaboratorioTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { cancelarRegressaoSchema } from "../../schemas/admin/laboratorio.schema";
export async function cancelarRegressao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("testes_execucao");
  const d = cancelarRegressaoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const filtroDono =
      ator.papel === "gestor_principal"
        ? eq(atendimentoIaExecucoesLaboratorioTable.id, d.execucaoId)
        : and(
            eq(atendimentoIaExecucoesLaboratorioTable.id, d.execucaoId),
            eq(
              atendimentoIaExecucoesLaboratorioTable.solicitadoPorId,
              ator.usuarioId,
            ),
          );
    const [x] = await tx
      .update(atendimentoIaExecucoesLaboratorioTable)
      .set({
        status: "cancelada",
        canceladoEm: new Date(),
        atualizadoEm: new Date(),
      })
      .where(
        and(
          filtroDono,
          inArray(atendimentoIaExecucoesLaboratorioTable.status, [
            "pendente",
            "processando",
            "falhou",
          ]),
        ),
      )
      .returning({ id: atendimentoIaExecucoesLaboratorioTable.id });
    if (!x) throw new Error("EXECUCAO_NAO_CANCELAVEL");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "cancelar_regressao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_laboratorio_cancelado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
