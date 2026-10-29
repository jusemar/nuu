import { z } from "zod";

/** Limites são validados no servidor; nenhuma entrada seleciona usuário ou fornecedor. */
export const filtrosProdutosAdminSchema = z
  .object({
    busca: z.string().trim().max(200).default(""),
    categoriaId: z.uuid().optional(),
    marcaId: z.uuid().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    ativo: z.boolean().optional(),
    pagina: z.number().int().min(1).max(100000).default(1),
    porPagina: z.number().int().min(1).max(100).default(50),
  })
  .strict();
