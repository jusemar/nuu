import { createHash } from "node:crypto";

import type { ConfiguracaoRag } from "../../../schemas/configuracao-rag.schema";
import { fragmentarDocumentoInstitucional } from "../../rag/fragmentar-documento";

export function prepararFragmentosCandidatos(
  conteudo: string,
  hashConteudo: string,
  configuracao: ConfiguracaoRag,
) {
  const fragmentos = fragmentarDocumentoInstitucional(conteudo, {
    limiteTokens: configuracao.ATENDENTE_IA_RAG_FRAGMENTO_TOKENS,
    sobreposicaoTokens: configuracao.ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS,
  });
  if (!fragmentos.length) throw new Error("CONTEUDO_SEM_FRAGMENTOS");
  return {
    fragmentos,
    hashIndexacao: createHash("sha256")
      .update(
        JSON.stringify({
          dimensao: configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
          hashConteudo,
          limite: configuracao.ATENDENTE_IA_RAG_FRAGMENTO_TOKENS,
          modelo: configuracao.OPENAI_RAG_MODELO_EMBEDDING,
          sobreposicao: configuracao.ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS,
        }),
      )
      .digest("hex"),
  };
}

export function validarEmbeddingsPublicacao(
  vetores: number[][],
  quantidade: number,
  dimensao: number,
) {
  if (vetores.length !== quantidade)
    throw new Error("QUANTIDADE_EMBEDDINGS_INCOMPATIVEL");
  if (
    vetores.some(
      (v) => v.length !== dimensao || v.some((n) => !Number.isFinite(n)),
    )
  )
    throw new Error("DIMENSAO_EMBEDDING_INCOMPATIVEL");
}
