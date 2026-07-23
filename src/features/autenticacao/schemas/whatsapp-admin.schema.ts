import { z } from "zod";

import { normalizarWhatsappAdmin } from "../lib/normalizar-whatsapp-admin";

export const whatsappAdminSchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .max(30, "Informe um número válido.")
    .refine(
      (valor) => !valor || normalizarWhatsappAdmin(valor),
      "Informe um WhatsApp brasileiro com DDD.",
    ),
});

export type WhatsappAdminSchema = z.infer<typeof whatsappAdminSchema>;
