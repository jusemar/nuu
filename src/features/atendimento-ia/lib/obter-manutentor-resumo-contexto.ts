import "server-only";

import { configuracaoContextoSchema } from "../schemas/configuracao-contexto.schema";
import { configuracaoOpenAiSchema } from "../schemas/configuracao-openai.schema";
import type { RepositorioResumoContexto } from "../types/resumo";
import { ClienteResponsesOpenAiOficial } from "./cliente-responses-openai";
import { criarGeradorResumoOpenAi } from "./gerador-resumo-openai";
import { manterResumoContexto } from "./manter-resumo-contexto";

export function obterManutentorResumoContexto(
  repositorio: RepositorioResumoContexto,
) {
  const openAi = configuracaoOpenAiSchema.safeParse(process.env);
  const contexto = configuracaoContextoSchema.safeParse(process.env);
  if (!openAi.success || !contexto.success) return undefined;
  const configuracaoOpenAi = {
    escalonamentoAtivo: false,
    maxContextTokens: contexto.data.ATENDENTE_IA_CONTEXTO_MAX_TOKENS,
    maxOutputTokens: openAi.data.OPENAI_ATENDENTE_MAX_OUTPUT_TOKENS,
    maxTentativas: openAi.data.OPENAI_ATENDENTE_MAX_TENTATIVAS,
    timeoutEmMs: openAi.data.OPENAI_ATENDENTE_TIMEOUT_MS,
  };
  const gerador = criarGeradorResumoOpenAi({
    cliente: new ClienteResponsesOpenAiOficial(openAi.data.OPENAI_API_KEY),
    configuracao: configuracaoOpenAi,
  });
  return (dados: Parameters<typeof manterResumoContexto>[1]) =>
    manterResumoContexto(
      {
        configuracao: {
          limiteTokens: contexto.data.ATENDENTE_IA_CONTEXTO_MAX_TOKENS,
          limiarAtualizacaoResumoTokens:
            contexto.data.ATENDENTE_IA_RESUMO_ATUALIZACAO_TOKENS,
          limiarPrimeiroResumoTokens:
            contexto.data.ATENDENTE_IA_RESUMO_INICIAL_TOKENS,
        },
        gerador,
        repositorio,
      },
      dados,
    );
}
