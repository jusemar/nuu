import { z } from "zod";

import { normalizarIdentidadeJaaa } from "../../lib/jaaa/endereco-publico-jaaa";
export const salvarIdentidadeJaaaSchema = z
  .object({
    usuarioId: z.string().min(1).max(200),
    identidade: z
      .string()
      .max(150)
      .transform((v) => normalizarIdentidadeJaaa(v))
      .pipe(z.string({ error: "Usuário Jaaa inválido." })),
    ativa: z.boolean(),
  })
  .strict();
export const salvarAtendimentoJaaaSchema = z
  .object({ produtoId: z.uuid(), autorizacaoId: z.uuid().nullable() })
  .strict();
export const paginacaoJaaaSchema = z
  .object({
    busca: z.string().trim().max(150).default(""),
    pagina: z.number().int().min(1).max(100000).default(1),
  })
  .strict();
