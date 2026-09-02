import { z } from "zod";

export const solicitarRecuperacaoAdminWhatsappSchema = z.object({
  phoneNumber: z.string(),
});

export const redefinirSenhaAdminWhatsappSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().regex(/^[0-9]{6}$/),
  newPassword: z.string().min(8).max(128),
});
