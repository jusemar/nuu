"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaRevisoesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { validarTransicaoRevisao } from "../../lib/admin/revisao/politica-transicao-revisao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarRevisaoSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function iniciarRevisao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("revisoes_decisao");
  const dados = atualizarRevisaoSchema.parse(entrada);
  if (dados.status !== "em_analise")
    throw new Error("TRANSICAO_REVISAO_INVALIDA");
  validarTransicaoRevisao("pendente", dados.status);
  await dbTransacional.transaction(async (transacao) => {
    const [revisao] = await transacao
      .update(atendimentoIaRevisoesTable)
      .set({
        atualizadoEm: new Date(),
        responsavelId: ator.usuarioId,
        status: "em_analise",
      })
      .where(
        and(
          eq(atendimentoIaRevisoesTable.id, dados.revisaoId),
          eq(atendimentoIaRevisoesTable.status, "pendente"),
          eq(
            atendimentoIaRevisoesTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaRevisoesTable.id });
    if (!revisao) throw new Error("REVISAO_DESATUALIZADA_OU_CONCLUIDA");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "iniciar_revisao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_revisao_iniciada",
      metadados: { revisaoId: revisao.id },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}
