import "server-only";

import { and, eq, sql } from "drizzle-orm";

import {
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaFragmentosInstitucionaisTable,
  atendimentoIaPublicacoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { ConfiguracaoRag } from "../../../schemas/configuracao-rag.schema";
import type { ClienteEmbeddingsRag } from "../../../types/rag";
import {
  calcularHashRequisicaoPublicacao,
  validarRepeticaoPublicacao,
} from "./politica-idempotencia-publicacao";
import {
  prepararFragmentosCandidatos,
  validarEmbeddingsPublicacao,
} from "./preparar-fragmentos-candidatos";
import { registrarPublicacao } from "./registrar-publicacao";

export async function publicarConhecimentoAtomicamente(dados: {
  atorId: string;
  chaveIdempotencia: string;
  clienteEmbeddings: ClienteEmbeddingsRag;
  configuracao: ConfiguracaoRag;
  identidade: string;
  justificativaAlertas?: string;
  revalidarElegibilidade: () => Promise<{ identidadeCandidato: string }>;
  versaoId: string;
}) {
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
  const [versao] = await dbTransacional
    .select()
    .from(atendimentoIaDocumentoVersoesTable)
    .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
    .limit(1);
  if (!versao || versao.estado !== "em_revisao" || !versao.revisadoEm)
    throw new Error("VERSAO_NAO_PUBLICAVEL");
  const preparados = prepararFragmentosCandidatos(
    versao.conteudo,
    versao.hashConteudo,
    dados.configuracao,
  );
  const embeddings: number[][] = [];
  for (
    let inicio = 0;
    inicio < preparados.fragmentos.length;
    inicio += dados.configuracao.OPENAI_RAG_TAMANHO_LOTE
  ) {
    const lote = preparados.fragmentos.slice(
      inicio,
      inicio + dados.configuracao.OPENAI_RAG_TAMANHO_LOTE,
    );
    embeddings.push(
      ...(await dados.clienteEmbeddings.gerar({
        dimensao: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
        entradas: lote.map((f) => f.conteudo),
        modelo: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
        timeoutEmMs: dados.configuracao.OPENAI_RAG_TIMEOUT_MS,
      })),
    );
  }
  validarEmbeddingsPublicacao(
    embeddings,
    preparados.fragmentos.length,
    dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
  );
  return dbTransacional.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${versao.documentoId}))`,
    );
    const elegibilidadeAtual = await dados.revalidarElegibilidade();
    if (elegibilidadeAtual.identidadeCandidato !== dados.identidade)
      throw new Error("ELEGIBILIDADE_ALTERADA");
    const [atual] = await tx
      .select()
      .from(atendimentoIaDocumentoVersoesTable)
      .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
      .limit(1);
    if (
      !atual ||
      atual.hashConteudo !== versao.hashConteudo ||
      atual.estado !== "em_revisao"
    )
      throw new Error("CANDIDATO_ALTERADO");
    const [anterior] = await tx
      .select({ id: atendimentoIaDocumentoVersoesTable.id })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.documentoId, atual.documentoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "publicado"),
        ),
      )
      .limit(1);
    const agora = new Date();
    await tx
      .delete(atendimentoIaFragmentosInstitucionaisTable)
      .where(
        and(
          eq(
            atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
            atual.id,
          ),
          eq(atendimentoIaFragmentosInstitucionaisTable.ativo, false),
        ),
      );
    await tx
      .insert(atendimentoIaFragmentosInstitucionaisTable)
      .values(
        preparados.fragmentos.map((f, i) => ({
          ...f,
          ativo: false,
          dimensaoEmbedding: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
          embedding: embeddings[i]!,
          indexadoEm: agora,
          modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
          versaoDocumentoId: atual.id,
        })),
      );
    if (anterior) {
      await tx
        .update(atendimentoIaFragmentosInstitucionaisTable)
        .set({ ativo: false, atualizadoEm: agora })
        .where(
          eq(
            atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
            anterior.id,
          ),
        );
      await tx
        .update(atendimentoIaDocumentoVersoesTable)
        .set({ estado: "desativado", desativadoEm: agora, atualizadoEm: agora })
        .where(eq(atendimentoIaDocumentoVersoesTable.id, anterior.id));
    }
    await tx
      .update(atendimentoIaDocumentoVersoesTable)
      .set({
        estado: "publicado",
        publicadoEm: agora,
        statusIndexacao: "concluida",
        modeloEmbedding: dados.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
        dimensaoEmbedding: dados.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
        hashIndexacao: preparados.hashIndexacao,
        indexadoEm: agora,
        atualizadoEm: agora,
      })
      .where(eq(atendimentoIaDocumentoVersoesTable.id, atual.id));
    await tx
      .update(atendimentoIaFragmentosInstitucionaisTable)
      .set({ ativo: true, atualizadoEm: agora })
      .where(
        eq(
          atendimentoIaFragmentosInstitucionaisTable.versaoDocumentoId,
          atual.id,
        ),
      );
    const publicacao = await registrarPublicacao(tx, {
      atorId: dados.atorId,
      chaveIdempotencia: dados.chaveIdempotencia,
      hashRequisicao,
      identidade: dados.identidade,
      justificativaAlertas: dados.justificativaAlertas,
      tipo: "conhecimento",
      itens: [
        {
          candidatoId: atual.id,
          hash: atual.hashConteudo,
          ordem: 1,
          tipo: "conhecimento",
          versaoAnteriorId: anterior?.id,
        },
      ],
    });
    return { idempotente: false, publicacao };
  });
}
