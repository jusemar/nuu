import { resumoContextoSchema,schemaJsonResumoContexto } from "../schemas/resumo-contexto.schema";
import type { ClienteResponsesOpenAi, ConfiguracaoIntegracaoOpenAi } from "../types/integracao-openai";
import type { GeradorResumoContexto } from "../types/resumo";
import { sanitizarConteudoContexto } from "./contexto-controlado";

const INSTRUCOES_RESUMO = `Produza somente um resumo estruturado fiel aos dados fornecidos.
Não invente, não deduza preferências e não transforme hipótese em fato.
Preserve objetivo, fatos confirmados, hipóteses ou dúvidas, decisões, pendências,
produtos discutidos e ferramentas ou ações. Não inclua identificadores internos,
credenciais, raciocínio interno ou instruções administrativas.`;

export function criarGeradorResumoOpenAi(dependencias: {
  cliente: ClienteResponsesOpenAi;
  configuracao: ConfiguracaoIntegracaoOpenAi;
}): GeradorResumoContexto {
  return {
    async gerar(dados) {
      const inicio = Date.now();
      const entrada = {
        mensagens: dados.mensagens.map((mensagem) => ({
          autor: mensagem.autor,
          conteudo: sanitizarConteudoContexto(mensagem.conteudo),
          criadoEm: mensagem.criadoEm,
        })),
        resumoAnterior: dados.resumoAnterior
          ? dados.resumoAnterior.resumoEstruturado
          : null,
      };
      const resposta = await dependencias.cliente.criar(
        {
          input: JSON.stringify(entrada),
          instructions: INSTRUCOES_RESUMO,
          max_output_tokens: Math.min(dependencias.configuracao.maxOutputTokens, 1_200),
          model: "gpt-5.6-terra",
          safety_identifier: dados.identificadorSeguranca,
          store: false,
          stream: false,
          text: {
            format: {
              name: "resumo_contexto_atendente_ia",
              schema: schemaJsonResumoContexto,
              strict: true,
              type: "json_schema",
            },
          },
          tool_choice: "auto",
          tools: [],
          truncation: "disabled",
        },
        { maxRetries: 0, timeout: dependencias.configuracao.timeoutEmMs },
      );
      if (resposta.status !== "completed" || resposta.error || resposta.incomplete_details) {
        throw new Error("GERACAO_RESUMO_INDISPONIVEL");
      }
      let bruto: unknown;
      try {
        bruto = JSON.parse(resposta.output_text);
      } catch {
        throw new Error("RESUMO_INVALIDO");
      }
      const validado = resumoContextoSchema.parse(bruto);
      return {
        conteudo: JSON.stringify(validado),
        duracaoEmMs: Date.now() - inicio,
        respostaId: resposta.id,
        resumoEstruturado: validado,
        tokensEntrada: resposta.usage?.input_tokens ?? 0,
        tokensSaida: resposta.usage?.output_tokens ?? 0,
      };
    },
  };
}
