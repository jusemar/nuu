"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaPropostasMelhoriaTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { converterPropostaCasoTesteSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function converterPropostaEmCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("testes_execucao");
  const dados = converterPropostaCasoTesteSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const [proposta] = await transacao
      .update(atendimentoIaPropostasMelhoriaTable)
      .set({
        atualizadoEm: new Date(),
        intencaoCasoTeste: {
          criadoPorId: ator.usuarioId,
          estado: "rascunho_intencao",
          resumoCenario: dados.resumoCenario,
          versaoContrato: "caso-teste-futuro-v1",
        },
      })
      .where(
        and(
          eq(atendimentoIaPropostasMelhoriaTable.id, dados.propostaId),
          isNull(atendimentoIaPropostasMelhoriaTable.intencaoCasoTeste),
        ),
      )
      .returning({ id: atendimentoIaPropostasMelhoriaTable.id });
    if (!proposta) throw new Error("PROPOSTA_NAO_DISPONIVEL_OU_JA_CONVERTIDA");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "preparar_conversao_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_intencao_caso_teste_criada",
      metadados: { propostaId: proposta.id },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}
