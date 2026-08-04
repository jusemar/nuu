import "server-only";

import { and, eq, sql } from "drizzle-orm";

import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaPublicacoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarInstrucoesPublicadas } from "./montar-instrucoes-publicadas";
import {
  calcularHashRequisicaoPublicacao,
  validarRepeticaoPublicacao,
} from "./politica-idempotencia-publicacao";
import { registrarPublicacao } from "./registrar-publicacao";
import { validarFallbackComportamento } from "./validar-fallback-comportamento";

export async function publicarComportamentoAtomicamente(dados: {
  atorId: string;
  chaveIdempotencia: string;
  identidade: string;
  justificativaAlertas?: string;
  revalidarElegibilidade: () => Promise<{ identidadeCandidato: string }>;
  versaoId: string;
}) {
  validarFallbackComportamento();
  const hashRequisicao = calcularHashRequisicaoPublicacao({
    identidade: dados.identidade,
    versaoId: dados.versaoId,
    justificativa: dados.justificativaAlertas ?? null,
  });
  const [existente] = await dbTransacional
    .select()
    .from(atendimentoIaPublicacoesTable)
    .where(
      eq(
        atendimentoIaPublicacoesTable.chaveIdempotencia,
        dados.chaveIdempotencia,
      ),
    )
    .limit(1);
  if (existente)
    return {
      idempotente:
        validarRepeticaoPublicacao(existente, hashRequisicao) === "concluida",
      publicacao: existente,
    };
  return dbTransacional.transaction(async (tx) => {
    const [versao] = await tx
      .select()
      .from(atendimentoIaComportamentoVersoesTable)
      .where(eq(atendimentoIaComportamentoVersoesTable.id, dados.versaoId))
      .limit(1);
    if (!versao || versao.estado !== "em_revisao" || !versao.revisadoEm)
      throw new Error("COMPORTAMENTO_NAO_PUBLICAVEL");
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${versao.comportamentoId}))`,
    );
    const elegibilidadeAtual = await dados.revalidarElegibilidade();
    if (elegibilidadeAtual.identidadeCandidato !== dados.identidade)
      throw new Error("ELEGIBILIDADE_ALTERADA");
    montarInstrucoesPublicadas(versao.configuracaoEstruturada);
    const [anterior] = await tx
      .select({ id: atendimentoIaComportamentoVersoesTable.id })
      .from(atendimentoIaComportamentoVersoesTable)
      .where(
        and(
          eq(
            atendimentoIaComportamentoVersoesTable.comportamentoId,
            versao.comportamentoId,
          ),
          eq(atendimentoIaComportamentoVersoesTable.estado, "publicado"),
        ),
      )
      .limit(1);
    const agora = new Date();
    if (anterior)
      await tx
        .update(atendimentoIaComportamentoVersoesTable)
        .set({ estado: "desativado", atualizadoEm: agora })
        .where(eq(atendimentoIaComportamentoVersoesTable.id, anterior.id));
    await tx
      .update(atendimentoIaComportamentoVersoesTable)
      .set({ estado: "publicado", atualizadoEm: agora })
      .where(eq(atendimentoIaComportamentoVersoesTable.id, versao.id));
    const publicacao = await registrarPublicacao(tx, {
      atorId: dados.atorId,
      chaveIdempotencia: dados.chaveIdempotencia,
      hashRequisicao,
      identidade: dados.identidade,
      justificativaAlertas: dados.justificativaAlertas,
      tipo: "comportamento",
      itens: [
        {
          candidatoId: versao.id,
          hash: versao.hash,
          ordem: 1,
          tipo: "comportamento",
          versaoAnteriorId: anterior?.id,
        },
      ],
    });
    return { idempotente: false, publicacao };
  });
}
