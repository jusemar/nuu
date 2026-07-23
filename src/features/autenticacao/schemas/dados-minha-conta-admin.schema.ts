import { z } from "zod";

import { normalizarWhatsappAdmin } from "../lib/normalizar-whatsapp-admin";

export const dadosMinhaContaAdminSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(254, "Informe um e-mail válido."),
  whatsapp: z
    .string()
    .trim()
    .max(30, "Informe um número válido.")
    .refine(
      (valor) => !valor || normalizarWhatsappAdmin(valor),
      "Informe um WhatsApp brasileiro com DDD.",
    ),
});

export type DadosMinhaContaAdminSchema = z.infer<
  typeof dadosMinhaContaAdminSchema
>;
