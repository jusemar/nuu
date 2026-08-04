"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaPropostasMelhoriaTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { validarTransicaoProposta } from "../../lib/admin/revisao/politica-transicao-proposta";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarPropostaMelhoriaSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function atualizarPropostaMelhoria(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("propostas_escrita");
  const dados = atualizarPropostaMelhoriaSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const [atual] = await transacao
      .select({
        criadoPorId: atendimentoIaPropostasMelhoriaTable.criadoPorId,
        responsavelId: atendimentoIaPropostasMelhoriaTable.responsavelId,
        status: atendimentoIaPropostasMelhoriaTable.status,
      })
      .from(atendimentoIaPropostasMelhoriaTable)
      .where(eq(atendimentoIaPropostasMelhoriaTable.id, dados.propostaId))
      .limit(1);
    if (!atual) throw new Error("PROPOSTA_NAO_DISPONIVEL");
    if (
      ator.papel === "revisor" &&
      atual.criadoPorId !== ator.usuarioId &&
      atual.responsavelId !== ator.usuarioId
    )
      throw new Error("PROPOSTA_NAO_DISPONIVEL");
    if (
      ator.papel === "revisor" &&
      dados.responsavelId !== undefined &&
      dados.responsavelId !== ator.usuarioId
    )
      throw new Error("RESPONSAVEL_NAO_PERMITIDO");
    if (dados.status && dados.status !== atual.status)
      validarTransicaoProposta(atual.status, dados.status);
    const [alterada] = await transacao
      .update(atendimentoIaPropostasMelhoriaTable)
      .set({
        atualizadoEm: new Date(),
        criterioAceite: dados.criterioAceite,
        descricao: dados.descricao,
        responsavelId: dados.responsavelId,
        status: dados.status,
        titulo: dados.titulo,
      })
      .where(
        and(
          eq(atendimentoIaPropostasMelhoriaTable.id, dados.propostaId),
          eq(
            atendimentoIaPropostasMelhoriaTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaPropostasMelhoriaTable.id });
    if (!alterada) throw new Error("PROPOSTA_DESATUALIZADA");
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "atualizar_proposta_melhoria",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_proposta_melhoria_atualizada",
      metadados: {
        justificativa: dados.justificativa,
        propostaId: alterada.id,
      },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}
