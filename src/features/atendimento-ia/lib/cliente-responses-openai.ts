import "server-only";

import OpenAI from "openai";

import type {
  ClienteResponsesOpenAi,
  OpcoesChamadaResponses,
  RequisicaoResponsesOpenAi,
} from "../types/integracao-openai";
import { ErroClienteResponsesOpenAi } from "../types/integracao-openai";

const CODIGOS_QUOTA = new Set([
  "credit_balance_exhausted",
  "insufficient_quota",
  "organization_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
  "project_spend_limit_exceeded",
]);

function diagnosticarErroOpenAi(
  erro: unknown,
  modelo: string,
) {
  const api = erro instanceof OpenAI.APIError ? erro : null;
  const codigo = typeof api?.code === "string" ? api.code : null;
  const tipo = typeof api?.type === "string" ? api.type : null;
  const quota = Boolean(
    (codigo && CODIGOS_QUOTA.has(codigo)) || tipo === "insufficient_quota",
  );
  const categoria =
    erro instanceof OpenAI.AuthenticationError
      ? "autenticacao"
      : erro instanceof OpenAI.RateLimitError
        ? quota
          ? "quota"
          : "rate_limit"
        : erro instanceof OpenAI.APIConnectionTimeoutError
          ? "timeout"
          : erro instanceof OpenAI.BadRequestError ||
              erro instanceof OpenAI.PermissionDeniedError ||
              erro instanceof OpenAI.NotFoundError ||
              erro instanceof OpenAI.UnprocessableEntityError
            ? "requisicao_invalida"
            : erro instanceof OpenAI.APIUserAbortError
              ? "cancelamento"
              : "indisponibilidade";

  // Somente metadados operacionais em lista permitida são registrados. A
  // mensagem original pode conter detalhes do payload e nunca vai ao log.
  console.error("[atendimento-ia:openai]", {
    categoria,
    codigo,
    etapa: "responses_api",
    mensagemSanitizada:
      categoria === "quota"
        ? "Quota ou saldo do projeto indisponível."
        : "Falha categorizada na integração com a OpenAI.",
    modelo,
    requestId: api?.requestID ?? null,
    statusHttp: api?.status ?? null,
    tipo,
  });
  return categoria;
}

export class ClienteResponsesOpenAiOficial implements ClienteResponsesOpenAi {
  private readonly cliente: OpenAI;

  constructor(chaveApi: string) {
    this.cliente = new OpenAI({ apiKey: chaveApi, maxRetries: 0 });
  }

  async criar(
    requisicao: RequisicaoResponsesOpenAi,
    opcoes: OpcoesChamadaResponses,
  ) {
    try {
      const resposta = await this.cliente.responses.create(
        requisicao as unknown as OpenAI.Responses.ResponseCreateParamsNonStreaming,
        opcoes,
      );
      console.info("[atendimento-ia:openai]", {
        categoria: "sucesso",
        codigo: null,
        etapa: "responses_api",
        mensagemSanitizada: "Resposta recebida e encaminhada para validação.",
        modelo: resposta.model,
        requestId:
          (resposta as typeof resposta & { _request_id?: string })._request_id ??
          null,
        statusHttp: 200,
        tipo: "response",
      });
      return {
        error: resposta.error,
        id: resposta.id,
        incomplete_details: resposta.incomplete_details,
        model: resposta.model,
        output: resposta.output as unknown as Array<Record<string, unknown>>,
        output_text: resposta.output_text,
        request_id:
          (resposta as typeof resposta & { _request_id?: string })._request_id ??
          null,
        status: resposta.status ?? "failed",
        usage: resposta.usage
          ? {
              input_tokens: resposta.usage.input_tokens,
              output_tokens: resposta.usage.output_tokens,
            }
          : undefined,
      };
    } catch (erro) {
      throw new ErroClienteResponsesOpenAi(
        diagnosticarErroOpenAi(erro, requisicao.model),
      );
    }
  }
}
