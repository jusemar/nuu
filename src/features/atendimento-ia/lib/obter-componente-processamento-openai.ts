import "server-only";

import { RepositorioFerramentasPublicasDrizzle } from "../actions/repositorio-ferramentas-publicas-drizzle";
import { fontesFerramentasPublicasOficiais } from "../queries/fontes-ferramentas-publicas";
import { configuracaoOpenAiSchema } from "../schemas/configuracao-openai.schema";
import {
  type ComponenteProcessamentoOrquestrado,
  FalhaComponenteOrquestrado,
} from "../types/orquestrador";
import { ClienteResponsesOpenAiOficial } from "./cliente-responses-openai";
import { criarComponenteProcessamentoOpenAi } from "./componente-processamento-openai";
import { criarCatalogoFerramentasPublicas } from "./ferramentas-publicas/catalogo-ferramentas-publicas";
import { criarExecutorFerramentasPublicas } from "./ferramentas-publicas/executar-ferramenta-publica";

export function obterComponenteProcessamentoOpenAi(
  escalonamentoAtivo: boolean,
): ComponenteProcessamentoOrquestrado {
  const validacao = configuracaoOpenAiSchema.safeParse(process.env);
  if (!validacao.success) {
    return {
      async processar() {
        throw new FalhaComponenteOrquestrado("definitiva", "falta_autorizacao");
      },
    };
  }

  const catalogo = criarCatalogoFerramentasPublicas(
    fontesFerramentasPublicasOficiais,
  );
  return criarComponenteProcessamentoOpenAi({
    cliente: new ClienteResponsesOpenAiOficial(validacao.data.OPENAI_API_KEY),
    configuracao: {
      escalonamentoAtivo,
      maxOutputTokens: validacao.data.OPENAI_ATENDENTE_MAX_OUTPUT_TOKENS,
      maxTentativas: validacao.data.OPENAI_ATENDENTE_MAX_TENTATIVAS,
      timeoutEmMs: validacao.data.OPENAI_ATENDENTE_TIMEOUT_MS,
    },
    executorFerramentas: criarExecutorFerramentasPublicas({
      catalogo,
      repositorio: new RepositorioFerramentasPublicasDrizzle(),
    }),
    ferramentas: [...catalogo.values()].map(
      (ferramenta) => ferramenta.definicao,
    ),
  });
}
