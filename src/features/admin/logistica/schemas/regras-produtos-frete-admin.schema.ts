import { z } from "zod";

export const criarRegraProdutoFreteSchema = z.object({
  produtoId: z.string().uuid("Produto inválido"),
  efeito: z.enum(["permitir", "bloquear"]),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z.string().uuid("Transportadora inválida").nullable().optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export const editarRegraProdutoFreteSchema = z.object({
  produtoId: z.string().uuid("Produto inválido").optional(),
  efeito: z.enum(["permitir", "bloquear"]).optional(),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z.string().uuid("Transportadora inválida").nullable().optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional(),
});

