import "server-only";

import OpenAI from "openai";

import type { ClienteEmbeddingsRag } from "../../types/rag";

export class ErroEmbeddingRag extends Error {
  constructor(public readonly classificacao: "recuperavel" | "definitiva") {
    super(`EMBEDDING_${classificacao.toUpperCase()}`);
  }
}

export class ClienteEmbeddingsOpenAiOficial implements ClienteEmbeddingsRag {
  private readonly cliente: OpenAI;

  constructor(chaveApi: string) {
    this.cliente = new OpenAI({ apiKey: chaveApi, maxRetries: 0 });
  }

  async gerar(dados: {
    dimensao: number;
    entradas: string[];
    modelo: string;
    timeoutEmMs: number;
  }) {
    try {
      const resposta = await this.cliente.embeddings.create(
        {
          dimensions: dados.dimensao,
          encoding_format: "float",
          input: dados.entradas,
          model: dados.modelo,
        },
        { maxRetries: 0, timeout: dados.timeoutEmMs },
      );
      return resposta.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (erro) {
      if (
        erro instanceof OpenAI.AuthenticationError ||
        erro instanceof OpenAI.BadRequestError ||
        erro instanceof OpenAI.PermissionDeniedError
      ) {
        throw new ErroEmbeddingRag("definitiva");
      }
      throw new ErroEmbeddingRag("recuperavel");
    }
  }
}
