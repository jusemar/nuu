import type { z } from "zod";

import { respostaChatAtendimentoSchema } from "../schemas/resposta-chat.schema";

export const NOME_CONTRATO_RESPOSTA_CHAT = "resposta_chat_atendimento_v1";

export type DiagnosticoContratoRespostaChat = {
  camposAusentes: string[];
  camposInvalidos: string[];
  camposInesperados: string[];
};

function caminhoDaFalha(caminho: PropertyKey[]) {
  return caminho.map(String).join(".") || "$";
}

export function diagnosticarContratoRespostaChat(
  erro: z.ZodError,
): DiagnosticoContratoRespostaChat {
  const ausentes = new Set<string>();
  const invalidos = new Set<string>();
  const inesperados = new Set<string>();

  for (const falha of erro.issues) {
    const caminho = caminhoDaFalha(falha.path);
    if (falha.code === "unrecognized_keys") {
      for (const chave of falha.keys) {
        inesperados.add(caminho === "$" ? chave : `${caminho}.${chave}`);
      }
    } else if (falha.code === "invalid_type" && falha.input === undefined) {
      ausentes.add(caminho);
    } else {
      invalidos.add(caminho);
    }
  }

  return {
    camposAusentes: [...ausentes].sort(),
    camposInvalidos: [...invalidos].sort(),
    camposInesperados: [...inesperados].sort(),
  };
}

export class ErroContratoRespostaChat extends Error {
  readonly codigo = "CONTRATO_RESPOSTA_CHAT_INVALIDO";
  readonly categoria = "contrato_resposta_invalido";

  constructor(
    public readonly diagnostico: DiagnosticoContratoRespostaChat,
  ) {
    super("CONTRATO_RESPOSTA_CHAT_INVALIDO");
    this.name = "ErroContratoRespostaChat";
  }
}

export function validarContratoRespostaChat(valor: unknown) {
  const validacao = respostaChatAtendimentoSchema.safeParse(valor);
  if (!validacao.success) {
    throw new ErroContratoRespostaChat(
      diagnosticarContratoRespostaChat(validacao.error),
    );
  }
  return validacao.data;
}
