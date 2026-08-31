import "server-only";

import { configuracaoWebhookWhatsappSchema } from "../../schemas/webhook-whatsapp.schema";
import type { ConfiguracaoWebhookWhatsapp } from "../../types/webhook-whatsapp.types";
import { ErroComunicacaoWhatsapp } from "../erros-whatsapp";

/**
 * Lê as credenciais do webhook sob demanda, no momento da requisição.
 *
 * Mesma escolha de `obterConfiguracaoWhatsappMeta`: a aplicação sobe
 * normalmente enquanto o webhook ainda não estiver configurado, e a ausência
 * de credencial vira um erro tratado na borda em vez de quebrar o build.
 */
export function obterConfiguracaoWebhookWhatsapp(
  ambiente: Record<string, string | undefined> = process.env,
): ConfiguracaoWebhookWhatsapp {
  const resultado = configuracaoWebhookWhatsappSchema.safeParse({
    tokenVerificacao: ambiente.WHATSAPP_META_VERIFY_TOKEN,
    segredoAplicacao: ambiente.WHATSAPP_META_APP_SECRET,
  });

  if (!resultado.success) {
    throw new ErroComunicacaoWhatsapp(
      "WEBHOOK_CONFIGURACAO_AUSENTE",
      "O webhook de WhatsApp não está configurado no servidor.",
    );
  }

  return resultado.data;
}
