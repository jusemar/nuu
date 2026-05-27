import { z } from "zod";

export const criarRegraCategoriaFreteSchema = z.object({
  categoriaId: z.string().uuid("Categoria inválida"),
  efeito: z.enum(["permitir", "bloquear"]),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z.string().uuid("Transportadora inválida").nullable().optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export const editarRegraCategoriaFreteSchema = z.object({
  categoriaId: z.string().uuid("Categoria inválida").optional(),
  efeito: z.enum(["permitir", "bloquear"]).optional(),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z.string().uuid("Transportadora inválida").nullable().optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional(),
});

