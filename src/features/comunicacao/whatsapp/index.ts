import "server-only";

import { enviarOtpWhatsapp } from "./lib/enviar-otp-whatsapp";
import { normalizarTelefoneAutenticavel } from "./lib/normalizar-telefone-autenticavel";

/** Único ponto público; consumidores não conhecem detalhes da Graph API. */
export const comunicacaoWhatsapp = {
  enviarOtp: enviarOtpWhatsapp,
  normalizarNumero: normalizarTelefoneAutenticavel,
} as const;

export type {
  EntradaEnvioOtpWhatsapp,
  FinalidadeOtpWhatsapp,
  ResultadoEnvioOtpWhatsapp,
} from "./types/comunicacao-whatsapp.types";
