import "server-only";

import { envioOtpWhatsappSchema } from "../schemas/envio-otp-whatsapp.schema";
import type {
  EntradaEnvioOtpWhatsapp,
  ResultadoEnvioOtpWhatsapp,
} from "../types/comunicacao-whatsapp.types";
import { obterConfiguracaoWhatsappMeta } from "./configuracao-whatsapp";
import { ErroComunicacaoWhatsapp } from "./erros-whatsapp";
import { enviarTemplatePelaMeta } from "./meta/cliente-meta-whatsapp";
import { montarTemplateAutenticacaoMeta } from "./templates/montar-template-autenticacao-meta";

export async function enviarOtpWhatsapp(
  entrada: EntradaEnvioOtpWhatsapp,
): Promise<ResultadoEnvioOtpWhatsapp> {
  const resultadoEntrada = envioOtpWhatsappSchema.safeParse(entrada);
  if (!resultadoEntrada.success) {
    throw new ErroComunicacaoWhatsapp(
      "ENTRADA_INVALIDA",
      "Os dados para envio do OTP por WhatsApp são inválidos.",
    );
  }

  const configuracao = obterConfiguracaoWhatsappMeta();
  const payload = montarTemplateAutenticacaoMeta({
    numero: resultadoEntrada.data.numero,
    codigo: resultadoEntrada.data.codigo,
    configuracao,
  });

  return enviarTemplatePelaMeta(configuracao, payload);
}
