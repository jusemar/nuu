import "server-only";

import OpenAI from "openai";

import type {
  ClienteResponsesOpenAi,
  OpcoesChamadaResponses,
  RequisicaoResponsesOpenAi,
} from "../types/integracao-openai";
import { ErroClienteResponsesOpenAi } from "../types/integracao-openai";

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
      return {
        error: resposta.error,
        id: resposta.id,
        incomplete_details: resposta.incomplete_details,
        model: resposta.model,
        output: resposta.output as unknown as Array<Record<string, unknown>>,
        output_text: resposta.output_text,
        status: resposta.status ?? "failed",
        usage: resposta.usage
          ? {
              input_tokens: resposta.usage.input_tokens,
              output_tokens: resposta.usage.output_tokens,
            }
          : undefined,
      };
    } catch (erro) {
      if (erro instanceof OpenAI.AuthenticationError) {
        throw new ErroClienteResponsesOpenAi("autenticacao");
      }
      if (
        erro instanceof OpenAI.BadRequestError ||
        erro instanceof OpenAI.PermissionDeniedError ||
        erro instanceof OpenAI.NotFoundError ||
        erro instanceof OpenAI.UnprocessableEntityError
      ) {
        throw new ErroClienteResponsesOpenAi("requisicao_invalida");
      }
      if (erro instanceof OpenAI.RateLimitError) {
        throw new ErroClienteResponsesOpenAi("rate_limit");
      }
      if (erro instanceof OpenAI.APIConnectionTimeoutError) {
        throw new ErroClienteResponsesOpenAi("timeout");
      }
      if (erro instanceof OpenAI.APIUserAbortError) {
        throw new ErroClienteResponsesOpenAi("cancelamento");
      }
      if (
        erro instanceof OpenAI.APIConnectionError ||
        erro instanceof OpenAI.InternalServerError ||
        erro instanceof OpenAI.ConflictError
      ) {
        throw new ErroClienteResponsesOpenAi("indisponibilidade");
      }
      throw new ErroClienteResponsesOpenAi("indisponibilidade");
    }
  }
}
