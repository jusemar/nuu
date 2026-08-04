"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaAvaliacoesTable,
  atendimentoIaMensagensTable,
  atendimentoIaRevisoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { calcularExpiracaoRevisao } from "../../lib/admin/revisao/politica-retencao-revisoes";
import { validarRubricaAvaliacao } from "../../lib/admin/revisao/validar-rubrica";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { registrarAvaliacaoRespostaAdminSchema } from "../../schemas/admin/avaliacao.schema";

export async function avaliarResposta(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("avaliacoes_escrita");
  const dados = registrarAvaliacaoRespostaAdminSchema.parse(entrada);
  const rubrica = validarRubricaAvaliacao(dados.criterios);
  const id = await dbTransacional.transaction(async (transacao) => {
    const [mensagem] = await transacao
      .select({ id: atendimentoIaMensagensTable.id })
      .from(atendimentoIaMensagensTable)
      .where(
        and(
          eq(atendimentoIaMensagensTable.id, dados.mensagemId),
          eq(atendimentoIaMensagensTable.conversaId, dados.conversaId),
          eq(atendimentoIaMensagensTable.autor, "assistente_ia"),
        ),
      )
      .limit(1);
    if (!mensagem) throw new Error("RESPOSTA_NAO_DISPONIVEL");

    const agora = new Date();
    const anteriores = await transacao
      .update(atendimentoIaAvaliacoesTable)
      .set({ status: "substituida", atualizadoEm: agora })
      .where(
        and(
          eq(atendimentoIaAvaliacoesTable.mensagemId, dados.mensagemId),
          eq(atendimentoIaAvaliacoesTable.status, "registrada"),
        ),
      )
      .returning({ id: atendimentoIaAvaliacoesTable.id });
    if (anteriores.length)
      await transacao
        .update(atendimentoIaRevisoesTable)
        .set({ status: "substituida", atualizadoEm: agora })
        .where(
          and(
            inArray(
              atendimentoIaRevisoesTable.avaliacaoId,
              anteriores.map((item) => item.id),
            ),
            inArray(atendimentoIaRevisoesTable.status, [
              "pendente",
              "em_analise",
              "aprovada",
              "reprovada",
            ]),
          ),
        );

    const [avaliacao] = await transacao
      .insert(atendimentoIaAvaliacoesTable)
      .values({
        avaliadoEm: agora,
        avaliadorId: ator.usuarioId,
        classificacaoProblema: dados.classificacaoProblema,
        comentario: dados.comentario,
        conversaId: dados.conversaId,
        criterios: { itens: rubrica.criterios, versao: rubrica.versao },
        mensagemId: dados.mensagemId,
        nota: dados.nota,
        origem: "revisao_admin",
        resolucao: dados.respostaCorrigida,
        resultado: dados.decisao,
        rubricaVersao: rubrica.versao,
        status: "registrada",
      })
      .returning({ id: atendimentoIaAvaliacoesTable.id });
    if (!avaliacao) throw new Error("FALHA_REGISTRAR_AVALIACAO");
    await transacao.insert(atendimentoIaRevisoesTable).values({
      autorId: ator.usuarioId,
      avaliacaoId: avaliacao.id,
      status: "pendente",
    });
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "avaliar_resposta",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_resposta_avaliada",
      metadados: {
        avaliacaoId: avaliacao.id,
        expiracaoRetencao: calcularExpiracaoRevisao(agora).toISOString(),
      },
      resultado: "sucesso_comprovado",
    });
    return avaliacao.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { id, sucesso: true as const };
}
