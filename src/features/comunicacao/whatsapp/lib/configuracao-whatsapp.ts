import "server-only";

import { configuracaoWhatsappMetaSchema } from "../schemas/configuracao-whatsapp.schema";
import type { ConfiguracaoWhatsappMeta } from "../types/comunicacao-whatsapp.types";
import { ErroComunicacaoWhatsapp } from "./erros-whatsapp";

/**
 * A configuração é lida apenas no momento do envio. Assim, a aplicação inicia
 * normalmente enquanto o transporte de WhatsApp ainda não estiver configurado.
 */
export function obterConfiguracaoWhatsappMeta(
  ambiente: Record<string, string | undefined> = process.env,
): ConfiguracaoWhatsappMeta {
  const resultado = configuracaoWhatsappMetaSchema.safeParse({
    tokenAcesso: ambiente.WHATSAPP_META_ACCESS_TOKEN,
    phoneNumberId: ambiente.WHATSAPP_META_PHONE_NUMBER_ID,
    versaoGraphApi: ambiente.WHATSAPP_META_GRAPH_API_VERSION,
    nomeTemplateOtp: ambiente.WHATSAPP_META_OTP_TEMPLATE_NAME,
    idiomaTemplateOtp: ambiente.WHATSAPP_META_OTP_TEMPLATE_LANGUAGE,
  });

  if (!resultado.success) {
    throw new ErroComunicacaoWhatsapp(
      "CONFIGURACAO_AUSENTE",
      "A integração server-side com WhatsApp não está configurada.",
    );
  }

  return resultado.data;
}
