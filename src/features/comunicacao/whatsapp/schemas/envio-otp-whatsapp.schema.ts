import { z } from "zod";

import { FINALIDADES_OTP_WHATSAPP } from "../constants/finalidades-otp-whatsapp";

export const telefoneAutenticavelSchema = z
  .string()
  .regex(/^\+55[1-9][0-9]9[0-9]{8}$/, "Telefone autenticável inválido");

export const envioOtpWhatsappSchema = z.object({
  numero: telefoneAutenticavelSchema,
  codigo: z.string().regex(/^[0-9]{4,8}$/, "Código OTP inválido"),
  finalidade: z.enum(FINALIDADES_OTP_WHATSAPP),
  identificadorOperacao: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9._:-]+$/, "Identificador de operação inválido"),
});
