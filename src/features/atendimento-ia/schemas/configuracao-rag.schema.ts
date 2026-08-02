import { z } from "zod";

import {
  CANDIDATOS_RAG_PADRAO,
  DIMENSAO_EMBEDDING_RAG_PADRAO,
  LIMITE_FRAGMENTO_RAG_PADRAO,
  MODELO_EMBEDDING_RAG_PADRAO,
  PESO_SEMANTICO_RAG_PADRAO,
  PESO_TEXTUAL_RAG_PADRAO,
  RELEVANCIA_MINIMA_RAG_PADRAO,
  RESULTADOS_RAG_PADRAO,
  SOBREPOSICAO_FRAGMENTO_RAG_PADRAO,
} from "../constants/rag";

const inteiro = (padrao: number) =>
  z.coerce.number().int().positive().optional().default(padrao);
const proporcao = (padrao: number) =>
  z.coerce.number().min(0).max(1).optional().default(padrao);

export const configuracaoRagSchema = z
  .object({
    OPENAI_RAG_MODELO_EMBEDDING: z.string().min(1).optional().default(MODELO_EMBEDDING_RAG_PADRAO),
    OPENAI_RAG_DIMENSAO_EMBEDDING: inteiro(DIMENSAO_EMBEDDING_RAG_PADRAO),
    ATENDENTE_IA_RAG_FRAGMENTO_TOKENS: inteiro(LIMITE_FRAGMENTO_RAG_PADRAO),
    ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS: z.coerce.number().int().min(0).optional().default(SOBREPOSICAO_FRAGMENTO_RAG_PADRAO),
    ATENDENTE_IA_RAG_PESO_SEMANTICO: proporcao(PESO_SEMANTICO_RAG_PADRAO),
    ATENDENTE_IA_RAG_PESO_TEXTUAL: proporcao(PESO_TEXTUAL_RAG_PADRAO),
    ATENDENTE_IA_RAG_CANDIDATOS: inteiro(CANDIDATOS_RAG_PADRAO),
    ATENDENTE_IA_RAG_RESULTADOS: inteiro(RESULTADOS_RAG_PADRAO),
    ATENDENTE_IA_RAG_RELEVANCIA_MINIMA: proporcao(RELEVANCIA_MINIMA_RAG_PADRAO),
    OPENAI_RAG_TIMEOUT_MS: inteiro(15_000),
    OPENAI_RAG_TAMANHO_LOTE: inteiro(32),
  })
  .superRefine((dados, contexto) => {
    if (dados.ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS >= dados.ATENDENTE_IA_RAG_FRAGMENTO_TOKENS) {
      contexto.addIssue({ code: "custom", message: "SOBREPOSICAO_RAG_INVALIDA" });
    }
    if (Math.abs(dados.ATENDENTE_IA_RAG_PESO_SEMANTICO + dados.ATENDENTE_IA_RAG_PESO_TEXTUAL - 1) > 0.000_001) {
      contexto.addIssue({ code: "custom", message: "PESOS_RAG_INVALIDOS" });
    }
    if (dados.ATENDENTE_IA_RAG_RESULTADOS > dados.ATENDENTE_IA_RAG_CANDIDATOS) {
      contexto.addIssue({ code: "custom", message: "LIMITE_RESULTADOS_RAG_INVALIDO" });
    }
  });

export type ConfiguracaoRag = z.infer<typeof configuracaoRagSchema>;
