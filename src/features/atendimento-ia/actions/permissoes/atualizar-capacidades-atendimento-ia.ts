"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaPapeisAdminTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarCapacidadesAtendimentoIaSchema } from "../../schemas/admin/permissoes.schema";

export async function atualizarCapacidadesAtendimentoIa(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("papeis_gestao");
  const dados = atualizarCapacidadesAtendimentoIaSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const alterados = await transacao
      .update(atendimentoIaPapeisAdminTable)
      .set({
        capacidadesAdicionais: dados.capacidadesAdicionais,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(atendimentoIaPapeisAdminTable.usuarioId, dados.usuarioId),
          eq(atendimentoIaPapeisAdminTable.ativo, true),
          eq(atendimentoIaPapeisAdminTable.papel, "visualizador"),
        ),
      )
      .returning({ id: atendimentoIaPapeisAdminTable.id });
    if (alterados.length === 0)
      throw new Error("VISUALIZADOR_ATIVO_NAO_ENCONTRADO");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "atualizar_capacidades",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_capacidades_atualizadas",
      metadados: { capacidades: dados.capacidadesAdicionais },
      resultado: "sucesso_comprovado",
      usuarioId: dados.usuarioId,
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento");
  return { sucesso: true as const };
}
