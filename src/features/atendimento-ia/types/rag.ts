import type { ConfiguracaoRag } from "../schemas/configuracao-rag.schema";

export type EstadoEditorialDocumento = "rascunho" | "em_revisao" | "publicado" | "desativado";

export type FragmentoInstitucional = {
  conteudo: string;
  hashConteudo: string;
  posicao: number;
  quantidadeTokens: number;
  secao: string | null;
};

export type VetorEmbedding = number[];

export interface ClienteEmbeddingsRag {
  gerar(dados: {
    dimensao: number;
    entradas: string[];
    modelo: string;
    timeoutEmMs: number;
  }): Promise<VetorEmbedding[]>;
}

export type CandidatoRag = {
  conteudo: string;
  documentoId: string;
  fragmentoId: string;
  hashConteudo: string;
  pontuacaoSemantica: number;
  pontuacaoTextual: number;
  secao: string | null;
  titulo: string;
  versao: number;
};

export type FonteRagSelecionada = CandidatoRag & { pontuacaoFinal: number };

export type ResultadoRecuperacaoRag = {
  configuracao: Pick<
    ConfiguracaoRag,
    | "ATENDENTE_IA_RAG_CANDIDATOS"
    | "ATENDENTE_IA_RAG_PESO_SEMANTICO"
    | "ATENDENTE_IA_RAG_PESO_TEXTUAL"
    | "ATENDENTE_IA_RAG_RELEVANCIA_MINIMA"
    | "ATENDENTE_IA_RAG_RESULTADOS"
  >;
  conflito: boolean;
  execucaoId: string;
  fontes: FonteRagSelecionada[];
  status: "fonte_encontrada" | "fonte_ausente" | "conflito";
};
