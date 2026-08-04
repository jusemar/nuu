"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaAvaliacoesTable,
  atendimentoIaPropostasMelhoriaTable,
  atendimentoIaRevisoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { calcularExpiracaoRevisao } from "../../lib/admin/revisao/politica-retencao-revisoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarPropostaMelhoriaPersistidaSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function criarPropostaMelhoria(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("propostas_escrita");
  const dados = criarPropostaMelhoriaPersistidaSchema.parse(entrada);
  const id = await dbTransacional.transaction(async (transacao) => {
    if (dados.avaliacaoOrigemId) {
      const [avaliacao] = await transacao
        .select({ id: atendimentoIaAvaliacoesTable.id })
        .from(atendimentoIaAvaliacoesTable)
        .where(eq(atendimentoIaAvaliacoesTable.id, dados.avaliacaoOrigemId))
        .limit(1);
      if (!avaliacao) throw new Error("EVIDENCIA_NAO_DISPONIVEL");
    }
    const agora = new Date();
    const [proposta] = await transacao
      .insert(atendimentoIaPropostasMelhoriaTable)
      .values({
        ...dados,
        criadoPorId: ator.usuarioId,
        expiraEm: calcularExpiracaoRevisao(agora),
        status: "aberta",
      })
      .returning({ id: atendimentoIaPropostasMelhoriaTable.id });
    if (!proposta) throw new Error("FALHA_CRIAR_PROPOSTA");
    await transacao.insert(atendimentoIaRevisoesTable).values({
      autorId: ator.usuarioId,
      propostaId: proposta.id,
      status: "pendente",
    });
    if (dados.avaliacaoOrigemId)
      await transacao
        .update(atendimentoIaAvaliacoesTable)
        .set({ propostaMelhoriaId: proposta.id, atualizadoEm: agora })
        .where(eq(atendimentoIaAvaliacoesTable.id, dados.avaliacaoOrigemId));
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "criar_proposta_melhoria",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_proposta_melhoria_criada",
      metadados: { propostaId: proposta.id },
      resultado: "sucesso_comprovado",
    });
    return proposta.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { id, sucesso: true as const };
}
