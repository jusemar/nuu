"use server";

import { and, count, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaPapeisAdminTable,
  atendimentoIaRevisoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import {
  podeAutorDecidir,
  validarTransicaoRevisao,
} from "../../lib/admin/revisao/politica-transicao-revisao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { decidirRevisaoSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function decidirRevisao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("revisoes_decisao");
  const dados = decidirRevisaoSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const [revisao] = await transacao
      .select({
        autorId: atendimentoIaRevisoesTable.autorId,
        status: atendimentoIaRevisoesTable.status,
      })
      .from(atendimentoIaRevisoesTable)
      .where(eq(atendimentoIaRevisoesTable.id, dados.revisaoId))
      .limit(1);
    if (!revisao) throw new Error("REVISAO_NAO_DISPONIVEL");
    validarTransicaoRevisao(revisao.status, dados.status);
    const [outros] = await transacao
      .select({ total: count() })
      .from(atendimentoIaPapeisAdminTable)
      .where(
        and(
          eq(atendimentoIaPapeisAdminTable.ativo, true),
          inArray(atendimentoIaPapeisAdminTable.papel, [
            "gestor_principal",
            "revisor",
          ]),
          ne(atendimentoIaPapeisAdminTable.usuarioId, ator.usuarioId),
        ),
      );
    if (
      !podeAutorDecidir({
        autorId: revisao.autorId,
        decisorId: ator.usuarioId,
        outrosDecisoresAtivos: outros?.total ?? 0,
      })
    )
      throw new Error("AUTOAPROVACAO_NAO_PERMITIDA");
    const agora = new Date();
    const [decidida] = await transacao
      .update(atendimentoIaRevisoesTable)
      .set({
        atualizadoEm: agora,
        decididoEm: agora,
        decididoPorId: ator.usuarioId,
        decisaoJustificativa: dados.justificativa,
        status: dados.status,
      })
      .where(
        and(
          eq(atendimentoIaRevisoesTable.id, dados.revisaoId),
          eq(
            atendimentoIaRevisoesTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
          eq(atendimentoIaRevisoesTable.status, revisao.status),
        ),
      )
      .returning({ id: atendimentoIaRevisoesTable.id });
    if (!decidida) throw new Error("REVISAO_DESATUALIZADA_OU_CONCLUIDA");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "decidir_revisao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_revisao_decidida",
      metadados: { revisaoId: decidida.id, status: dados.status },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}
