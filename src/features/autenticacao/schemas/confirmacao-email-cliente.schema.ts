import { z } from "zod";

import { emailEhTecnicoTelefone } from "../lib/email-tecnico-telefone-compartilhado";

export const solicitarConfirmacaoEmailSchema = z.object({
  email: z
    .email()
    .transform((email) => email.trim().toLowerCase())
    .refine((email) => !emailEhTecnicoTelefone(email)),
});

export const confirmarEmailClienteSchema = z.object({
  token: z.string().min(32).max(256),
});

export const confirmarReautenticacaoWhatsappSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/),
});
