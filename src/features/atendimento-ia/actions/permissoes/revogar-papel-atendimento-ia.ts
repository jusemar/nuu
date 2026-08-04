"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaPapeisAdminTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { revogarPapelAtendimentoIaSchema } from "../../schemas/admin/permissoes.schema";

export async function revogarPapelAtendimentoIa(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("papeis_gestao");
  const dados = revogarPapelAtendimentoIaSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const alterados = await transacao
      .update(atendimentoIaPapeisAdminTable)
      .set({
        ativo: false,
        atualizadoEm: new Date(),
        revogadoEm: new Date(),
        revogadoPorId: ator.usuarioId,
      })
      .where(
        and(
          eq(atendimentoIaPapeisAdminTable.usuarioId, dados.usuarioId),
          eq(atendimentoIaPapeisAdminTable.ativo, true),
        ),
      )
      .returning({ id: atendimentoIaPapeisAdminTable.id });
    if (alterados.length === 0) throw new Error("PAPEL_ATIVO_NAO_ENCONTRADO");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "revogar_papel",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_papel_revogado",
      resultado: "sucesso_comprovado",
      usuarioId: dados.usuarioId,
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento");
  return { sucesso: true as const };
}
