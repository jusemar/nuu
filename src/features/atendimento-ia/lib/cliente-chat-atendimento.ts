import { VERSAO_AVISO_PRIVACIDADE_CHAT } from "../constants/contexto";
import {
  erroChatAtendimentoSchema,
  historicoChatAtendimentoSchema,
  respostaChatAtendimentoSchema,
} from "../schemas/resposta-chat.schema";
import type {
  HistoricoChatAtendimento,
  RespostaChatAtendimento,
} from "../types/chat";
import {
  diagnosticarContratoRespostaChat,
  NOME_CONTRATO_RESPOSTA_CHAT,
} from "./contrato-resposta-chat";

export class ErroChatAtendimento extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export async function enviarMensagemChat(
  dados: {
    chaveIdempotencia: string;
    conversaId?: string;
    mensagem: string;
  },
  requisitar: typeof fetch = fetch,
): Promise<RespostaChatAtendimento> {
  let resposta: Response;
  try {
    resposta = await requisitar("/api/atendimento-ia/mensagens", {
      body: JSON.stringify({
        avisoPrivacidadeVersao: VERSAO_AVISO_PRIVACIDADE_CHAT,
        canal: "site",
        ...dados,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  } catch {
    throw new ErroChatAtendimento(
      "REDE_INDISPONIVEL",
      "Não foi possível conectar ao atendimento. Verifique sua conexão e tente novamente.",
    );
  }

  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    throw new ErroChatAtendimento(
      "RESPOSTA_INVALIDA",
      "O atendimento retornou uma resposta inválida. Tente novamente.",
    );
  }

  if (!resposta.ok) {
    const erro = erroChatAtendimentoSchema.safeParse(corpo);
    throw new ErroChatAtendimento(
      erro.success ? erro.data.erro.codigo : "ATENDIMENTO_INDISPONIVEL",
      erro.success
        ? erro.data.erro.mensagem
        : "O atendimento está indisponível no momento. Tente novamente.",
    );
  }

  const validacao = respostaChatAtendimentoSchema.safeParse(corpo);
  if (!validacao.success) {
    console.error("[atendimento-ia:cliente-contrato]", {
      contrato: NOME_CONTRATO_RESPOSTA_CHAT,
      etapa: "desserializacao_resposta",
      ...diagnosticarContratoRespostaChat(validacao.error),
      statusHttp: resposta.status,
    });
    throw new ErroChatAtendimento(
      "RESPOSTA_INVALIDA",
      "O atendimento retornou uma resposta inválida. Tente novamente.",
    );
  }
  return validacao.data.dados;
}

export async function recuperarHistoricoChat(
  conversaId: string,
  requisitar: typeof fetch = fetch,
): Promise<HistoricoChatAtendimento> {
  const resposta = await requisitar(
    `/api/atendimento-ia/mensagens?conversaId=${encodeURIComponent(conversaId)}`,
  );
  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    throw new ErroChatAtendimento(
      "RESPOSTA_INVALIDA",
      "Não foi possível recuperar esta conversa.",
    );
  }
  if (!resposta.ok) {
    const erro = erroChatAtendimentoSchema.safeParse(corpo);
    throw new ErroChatAtendimento(
      erro.success ? erro.data.erro.codigo : "CONVERSA_INDISPONIVEL",
      erro.success
        ? erro.data.erro.mensagem
        : "Não foi possível recuperar esta conversa.",
    );
  }
  const validacao = historicoChatAtendimentoSchema.safeParse(corpo);
  if (!validacao.success) {
    console.error("[atendimento-ia:cliente-contrato]", {
      contrato: "historico_chat_atendimento_v1",
      etapa: "desserializacao_historico",
      ...diagnosticarContratoRespostaChat(validacao.error),
      statusHttp: resposta.status,
    });
    throw new ErroChatAtendimento(
      "RESPOSTA_INVALIDA",
      "Não foi possível recuperar esta conversa.",
    );
  }
  return validacao.data.dados;
}
