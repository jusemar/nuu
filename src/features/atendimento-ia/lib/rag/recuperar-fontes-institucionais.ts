import { createHash } from "node:crypto";

import { RepositorioConhecimentoInstitucionalDrizzle } from "../../actions/repositorio-conhecimento-institucional-drizzle";
import type { ConfiguracaoRag } from "../../schemas/configuracao-rag.schema";
import type { ClienteEmbeddingsRag, ResultadoRecuperacaoRag } from "../../types/rag";
import {
  combinarResultadosRag,
  conteudoInstitucionalContemInstrucaoMaliciosa,
  detectarConflitoFontes,
} from "./combinar-resultados-rag";

export async function recuperarFontesInstitucionais(dependencias: {
  clienteEmbeddings: ClienteEmbeddingsRag;
  configuracao: ConfiguracaoRag;
  repositorio: RepositorioConhecimentoInstitucionalDrizzle;
  ragAtivo: boolean;
}, dados: { execucaoId: string; pergunta: string }): Promise<ResultadoRecuperacaoRag> {
  const configuracaoRegistrada = {
    ATENDENTE_IA_RAG_CANDIDATOS: dependencias.configuracao.ATENDENTE_IA_RAG_CANDIDATOS,
    ATENDENTE_IA_RAG_PESO_SEMANTICO:
      dependencias.configuracao.ATENDENTE_IA_RAG_PESO_SEMANTICO,
    ATENDENTE_IA_RAG_PESO_TEXTUAL: dependencias.configuracao.ATENDENTE_IA_RAG_PESO_TEXTUAL,
    ATENDENTE_IA_RAG_RELEVANCIA_MINIMA:
      dependencias.configuracao.ATENDENTE_IA_RAG_RELEVANCIA_MINIMA,
    ATENDENTE_IA_RAG_RESULTADOS: dependencias.configuracao.ATENDENTE_IA_RAG_RESULTADOS,
  };
  const hashPergunta = createHash("sha256").update(dados.pergunta).digest("hex");
  const ausencia = (): ResultadoRecuperacaoRag => ({
    configuracao: configuracaoRegistrada,
    conflito: false,
    execucaoId: dados.execucaoId,
    fontes: [],
    status: "fonte_ausente",
  });
  if (
    !dependencias.ragAtivo ||
    !(await dependencias.repositorio.possuiBasePublicadaCompativel({
      dimensao: dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
      modelo: dependencias.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
    }))
  ) {
    const resultado = ausencia();
    await dependencias.repositorio.registrarBusca({ ...resultado, hashPergunta });
    return resultado;
  }
  const [vetor] = await dependencias.clienteEmbeddings.gerar({
    dimensao: dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
    entradas: [dados.pergunta],
    modelo: dependencias.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
    timeoutEmMs: dependencias.configuracao.OPENAI_RAG_TIMEOUT_MS,
  });
  if (!vetor || vetor.length !== dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING) {
    throw new Error("DIMENSAO_EMBEDDING_INCOMPATIVEL");
  }
  const candidatos = await dependencias.repositorio.buscarCandidatos({
    dimensao: dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
    limite: dependencias.configuracao.ATENDENTE_IA_RAG_CANDIDATOS,
    modelo: dependencias.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
    pesoSemantico: dependencias.configuracao.ATENDENTE_IA_RAG_PESO_SEMANTICO,
    pesoTextual: dependencias.configuracao.ATENDENTE_IA_RAG_PESO_TEXTUAL,
    pergunta: dados.pergunta,
    vetor,
  });
  const fontes = combinarResultadosRag(candidatos, {
    limiteCandidatos: dependencias.configuracao.ATENDENTE_IA_RAG_CANDIDATOS,
    limiteResultados: dependencias.configuracao.ATENDENTE_IA_RAG_RESULTADOS,
    pesoSemantico: dependencias.configuracao.ATENDENTE_IA_RAG_PESO_SEMANTICO,
    pesoTextual: dependencias.configuracao.ATENDENTE_IA_RAG_PESO_TEXTUAL,
    relevanciaMinima: dependencias.configuracao.ATENDENTE_IA_RAG_RELEVANCIA_MINIMA,
  }).map((fonte) => ({
    ...fonte,
    conteudo: conteudoInstitucionalContemInstrucaoMaliciosa(fonte.conteudo)
      ? "[CONTEUDO_INSTITUCIONAL_NAO_EXECUTAVEL]"
      : fonte.conteudo,
  }));
  const conflito = detectarConflitoFontes(fontes);
  const resultado: ResultadoRecuperacaoRag = {
    configuracao: configuracaoRegistrada,
    conflito,
    execucaoId: dados.execucaoId,
    fontes,
    status: conflito ? "conflito" : fontes.length > 0 ? "fonte_encontrada" : "fonte_ausente",
  };
  await dependencias.repositorio.registrarBusca({ ...resultado, hashPergunta });
  return resultado;
}
