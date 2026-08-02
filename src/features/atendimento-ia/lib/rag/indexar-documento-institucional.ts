import {
  calcularHashIndexacao,
  RepositorioConhecimentoInstitucionalDrizzle,
} from "../../actions/repositorio-conhecimento-institucional-drizzle";
import { PADROES_CONTEUDO_PROIBIDO_RAG } from "../../constants/rag";
import type { ConfiguracaoRag } from "../../schemas/configuracao-rag.schema";
import { documentoInstitucionalSchema } from "../../schemas/documento-institucional.schema";
import type { ClienteEmbeddingsRag } from "../../types/rag";
import {
  calcularHashDocumento,
  fragmentarDocumentoInstitucional,
} from "./fragmentar-documento";

export async function criarDocumentoInstitucional(
  repositorio: RepositorioConhecimentoInstitucionalDrizzle,
  entrada: unknown,
) {
  const dados = documentoInstitucionalSchema.parse(entrada);
  if (PADROES_CONTEUDO_PROIBIDO_RAG.some((padrao) => padrao.test(dados.conteudo))) {
    throw new Error("CONTEUDO_INSTITUCIONAL_PROIBIDO");
  }
  return repositorio.criarVersao({
    ...dados,
    hashConteudo: calcularHashDocumento(dados.conteudo),
  });
}

export async function publicarDocumentoInstitucional(dependencias: {
  clienteEmbeddings: ClienteEmbeddingsRag;
  configuracao: ConfiguracaoRag;
  repositorio: RepositorioConhecimentoInstitucionalDrizzle;
  responsavelRevisaoId: string;
  versaoId: string;
}) {
  const versao = await dependencias.repositorio.buscarVersao(dependencias.versaoId);
  if (!versao) throw new Error("VERSAO_NAO_REVISAVEL");
  if (dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING !== 1_536) {
    throw new Error("REINDEXACAO_CONTROLADA_NECESSARIA");
  }
  const fragmentos = fragmentarDocumentoInstitucional(versao.conteudo, {
    limiteTokens: dependencias.configuracao.ATENDENTE_IA_RAG_FRAGMENTO_TOKENS,
    sobreposicaoTokens:
      dependencias.configuracao.ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS,
  });
  const hashIndexacao = calcularHashIndexacao({
    dimensao: dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
    hashConteudo: versao.hashConteudo,
    limite: dependencias.configuracao.ATENDENTE_IA_RAG_FRAGMENTO_TOKENS,
    modelo: dependencias.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
    sobreposicao:
      dependencias.configuracao.ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS,
  });
  const idempotente = await dependencias.repositorio.buscarIndexacaoConcluida(
    versao.id,
    hashIndexacao,
  );
  if (idempotente) return { idempotente: true, versao: idempotente };
  if (versao.estado !== "em_revisao") throw new Error("VERSAO_NAO_REVISAVEL");
  await dependencias.repositorio.iniciarIndexacao(versao.id);
  try {
    const embeddings: number[][] = [];
    for (
      let inicio = 0;
      inicio < fragmentos.length;
      inicio += dependencias.configuracao.OPENAI_RAG_TAMANHO_LOTE
    ) {
      const lote = fragmentos.slice(
        inicio,
        inicio + dependencias.configuracao.OPENAI_RAG_TAMANHO_LOTE,
      );
      const vetores = await dependencias.clienteEmbeddings.gerar({
        dimensao: dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING,
        entradas: lote.map((fragmento) => fragmento.conteudo),
        modelo: dependencias.configuracao.OPENAI_RAG_MODELO_EMBEDDING,
        timeoutEmMs: dependencias.configuracao.OPENAI_RAG_TIMEOUT_MS,
      });
      if (
        vetores.length !== lote.length ||
        vetores.some(
          (vetor) =>
            vetor.length !== dependencias.configuracao.OPENAI_RAG_DIMENSAO_EMBEDDING ||
            vetor.some((valor) => !Number.isFinite(valor)),
        )
      ) {
        throw new Error("DIMENSAO_EMBEDDING_INCOMPATIVEL");
      }
      embeddings.push(...vetores);
    }
    return await dependencias.repositorio.publicarIndexacao({
      configuracao: dependencias.configuracao,
      embeddings,
      fragmentos,
      hashIndexacao,
      responsavelRevisaoId: dependencias.responsavelRevisaoId,
      versaoId: dependencias.versaoId,
    });
  } catch (erro) {
    await dependencias.repositorio.registrarFalhaIndexacao(versao.id);
    throw erro;
  }
}
