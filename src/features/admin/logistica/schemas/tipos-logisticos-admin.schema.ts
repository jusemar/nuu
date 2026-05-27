import { z } from "zod";

export const criarTipoLogisticoSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(1, "Identificador é obrigatório")
    .max(120),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(160),
  descricao: z.string().trim().max(500).nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export const editarTipoLogisticoSchema = z.object({
  identificador: z.string().trim().min(1).max(120).optional(),
  nome: z.string().trim().min(1).max(160).optional(),
  descricao: z.string().trim().max(500).nullable().optional(),
  ativo: z.boolean().optional(),
});

export const vincularProdutoTipoLogisticoSchema = z.object({
  produtoId: z.string().uuid("Produto inválido"),
  tipoLogisticoId: z.string().uuid("Tipo logístico inválido"),
});

export const vincularVarianteTipoLogisticoSchema = z.object({
  varianteId: z.string().uuid("Variante inválida"),
  tipoLogisticoId: z.string().uuid("Tipo logístico inválido"),
});

export const criarRegraTipoLogisticoFreteSchema = z.object({
  tipoLogisticoId: z.string().uuid("Tipo logístico inválido"),
  efeito: z.enum(["permitir", "bloquear"]),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z
    .string()
    .uuid("Transportadora inválida")
    .nullable()
    .optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export const editarRegraTipoLogisticoFreteSchema = z.object({
  tipoLogisticoId: z.string().uuid("Tipo logístico inválido").optional(),
  efeito: z.enum(["permitir", "bloquear"]).optional(),
  provedorFreteId: z.string().uuid("Provedor inválido").nullable().optional(),
  transportadoraFreteId: z
    .string()
    .uuid("Transportadora inválida")
    .nullable()
    .optional(),
  servicoFreteId: z.string().uuid("Serviço inválido").nullable().optional(),
  ativo: z.boolean().optional(),
});
