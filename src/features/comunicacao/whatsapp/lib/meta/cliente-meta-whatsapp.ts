import "server-only";

import { z } from "zod";

import { TIMEOUT_META_WHATSAPP_MS } from "../../constants/template-autenticacao-whatsapp";
import type {
  ConfiguracaoWhatsappMeta,
  PayloadTemplateAutenticacaoMeta,
  ResultadoEnvioOtpWhatsapp,
} from "../../types/comunicacao-whatsapp.types";
import { ErroComunicacaoWhatsapp } from "../erros-whatsapp";

const respostaEnvioMetaSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1) })).min(1),
});

type DependenciasClienteMeta = {
  fetch: typeof fetch;
  timeoutMs: number;
};

export async function enviarTemplatePelaMeta(
  configuracao: ConfiguracaoWhatsappMeta,
  payload: PayloadTemplateAutenticacaoMeta,
  dependencias: Partial<DependenciasClienteMeta> = {},
): Promise<ResultadoEnvioOtpWhatsapp> {
  const executarFetch = dependencias.fetch ?? fetch;
  const timeoutMs = dependencias.timeoutMs ?? TIMEOUT_META_WHATSAPP_MS;
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), timeoutMs);

  try {
    const resposta = await executarFetch(
      `https://graph.facebook.com/${configuracao.versaoGraphApi}/${configuracao.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${configuracao.tokenAcesso}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controle.signal,
      },
    );

    if (!resposta.ok) {
      throw new ErroComunicacaoWhatsapp(
        "META_HTTP",
        "A Meta recusou o envio da mensagem de autenticação.",
        { statusHttp: resposta.status },
      );
    }

    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      throw new ErroComunicacaoWhatsapp(
        "RESPOSTA_INVALIDA",
        "A Meta retornou uma resposta inválida para o envio.",
      );
    }

    const resultado = respostaEnvioMetaSchema.safeParse(corpo);
    if (!resultado.success) {
      throw new ErroComunicacaoWhatsapp(
        "RESPOSTA_INVALIDA",
        "A Meta retornou uma resposta inválida para o envio.",
      );
    }

    return { idMensagem: resultado.data.messages[0].id };
  } catch (erro) {
    if (erro instanceof ErroComunicacaoWhatsapp) throw erro;

    if (controle.signal.aborted) {
      throw new ErroComunicacaoWhatsapp(
        "TIMEOUT",
        "O envio pelo WhatsApp excedeu o tempo limite.",
      );
    }

    throw new ErroComunicacaoWhatsapp(
      "TRANSPORTE",
      "Não foi possível comunicar com o serviço de WhatsApp.",
    );
  } finally {
    clearTimeout(temporizador);
  }
}
