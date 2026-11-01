import { z } from "zod";

import { normalizarIdentidadeJaaa } from "../../lib/jaaa/endereco-publico-jaaa";
/** Validação da revisão visual; será reutilizada pela escrita autenticada após aprovação. */
export const identidadeJaaaSchema = z.object({
  identidade: z
    .string()
    .max(150)
    .transform((v) => normalizarIdentidadeJaaa(v))
    .refine(
      (v) => v !== null,
      "Use de 3 a 30 letras, números ou _, começando por uma letra.",
    ),
  ativa: z.boolean(),
});
