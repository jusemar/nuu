import { z } from "zod";

export const configuracaoFerramentasProtegidasSchema = z.object({
  ATENDENTE_IA_CONFIRMACAO_VALIDADE_MS: z.coerce
    .number()
    .int()
    .min(30_000)
    .max(15 * 60 * 1_000)
    .optional()
    .default(5 * 60 * 1_000),
});
