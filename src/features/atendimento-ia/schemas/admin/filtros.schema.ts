import { z } from "zod";

export const LIMITE_MAXIMO_PAGINACAO_ADMIN = 100;

export const paginacaoAdminSchema = z
  .object({
    limite: z.coerce
      .number()
      .int()
      .min(1)
      .max(LIMITE_MAXIMO_PAGINACAO_ADMIN)
      .default(20),
    pagina: z.coerce.number().int().min(1).max(10_000).default(1),
  })
  .strict();

export const filtrosAdminSchema = paginacaoAdminSchema.extend({
  busca: z.string().trim().max(120).optional(),
  ordenacao: z
    .enum(["mais_recentes", "mais_antigos", "titulo_asc", "titulo_desc"])
    .default("mais_recentes"),
});

export const periodoAdminSchema = z
  .object({
    ate: z.coerce.date(),
    desde: z.coerce.date(),
  })
  .strict()
  .refine((periodo) => periodo.ate > periodo.desde, {
    message: "O fim do período deve ser posterior ao início.",
    path: ["ate"],
  });
