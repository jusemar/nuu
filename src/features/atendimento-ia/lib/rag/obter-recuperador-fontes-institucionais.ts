import "server-only";

import { RepositorioConhecimentoInstitucionalDrizzle } from "../../actions/repositorio-conhecimento-institucional-drizzle";
import type { ConfiguracaoRag } from "../../schemas/configuracao-rag.schema";
import type { ClienteEmbeddingsRag } from "../../types/rag";
import { ClienteEmbeddingsOpenAiOficial } from "./cliente-embeddings-openai";
import { recuperarFontesInstitucionais } from "./recuperar-fontes-institucionais";

export function obterRecuperadorFontesInstitucionais(dados: {
  configuracao: ConfiguracaoRag;
  ragAtivo: boolean;
}) {
  const cliente: ClienteEmbeddingsRag = process.env.OPENAI_API_KEY
    ? new ClienteEmbeddingsOpenAiOficial(process.env.OPENAI_API_KEY)
    : {
        async gerar() {
          throw new Error("OPENAI_API_KEY_AUSENTE");
        },
      };
  const repositorio = new RepositorioConhecimentoInstitucionalDrizzle();
  return (entrada: { execucaoId: string; pergunta: string }) =>
    recuperarFontesInstitucionais(
      {
        clienteEmbeddings: cliente,
        configuracao: dados.configuracao,
        ragAtivo: dados.ragAtivo,
        repositorio,
      },
      entrada,
    );
}
