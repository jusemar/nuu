import { z } from "zod";

export const salvarVinculoRepresentanteSchema = z
  .object({
    usuarioId: z.string().trim().min(1).max(255),
    fornecedorId: z.uuid(),
    ativo: z.boolean(),
  })
  .strict();

export const salvarAutorizacaoProdutoRepresentanteSchema = z
  .object({
    representanteFornecedorId: z.uuid(),
    produtoId: z.uuid(),
    ativa: z.boolean(),
  })
  .strict();
