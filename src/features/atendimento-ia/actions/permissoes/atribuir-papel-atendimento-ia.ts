"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  administradoresTable,
  atendimentoIaPapeisAdminTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atribuirPapelAtendimentoIaSchema } from "../../schemas/admin/permissoes.schema";

export async function atribuirPapelAtendimentoIa(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("papeis_gestao");
  const dados = atribuirPapelAtendimentoIaSchema.parse(entrada);

  await dbTransacional.transaction(async (transacao) => {
    const [administradorGlobal] = await transacao
      .select({ id: administradoresTable.id })
      .from(administradoresTable)
      .where(
        and(
          eq(administradoresTable.usuarioId, dados.usuarioId),
          eq(administradoresTable.status, "ativo"),
        ),
      )
      .limit(1);
    if (!administradorGlobal)
      throw new Error("USUARIO_NAO_AUTORIZADO_NO_ADMIN");

    await transacao
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
      );
    await transacao.insert(atendimentoIaPapeisAdminTable).values({
      ativo: true,
      capacidadesAdicionais: [],
      origem: "atribuicao_explicita",
      papel: dados.papel,
      atribuidoPorId: ator.usuarioId,
      usuarioId: dados.usuarioId,
    });
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "atribuir_papel",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_papel_atribuido",
      metadados: { papel: dados.papel },
      resultado: "sucesso_comprovado",
      usuarioId: dados.usuarioId,
    });
  });

  revalidatePath("/admin/atendente-ia/treinamento");
  return { sucesso: true as const };
}
