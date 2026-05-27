import { z } from "zod";

const identificadorSchema = z
  .string()
  .trim()
  .min(1, "Identificador é obrigatório")
  .max(120, "Identificador deve ter no máximo 120 caracteres");

const nomeSchema = z
  .string()
  .trim()
  .min(1, "Nome é obrigatório")
  .max(160, "Nome deve ter no máximo 160 caracteres");

const limiteOpcionalNumeroInteiroPositivo = z
  .number()
  .int("Valor deve ser inteiro")
  .positive("Valor deve ser maior que zero")
  .nullable()
  .optional();

export const criarProvedorFreteSchema = z.object({
  identificador: identificadorSchema,
  nome: nomeSchema,
  ativo: z.boolean().optional().default(true),
});

export const editarProvedorFreteSchema = z.object({
  nome: nomeSchema.optional(),
  identificador: identificadorSchema.optional(),
});

export const alternarAtivacaoSchema = z.object({
  ativo: z.boolean(),
});

export const criarTransportadoraFreteSchema = z.object({
  provedorFreteId: z
    .string()
    .uuid("Provedor de frete inválido")
    .min(1, "Provedor de frete é obrigatório"),
  identificador: identificadorSchema,
  nome: nomeSchema,
  ativo: z.boolean().optional().default(true),
  pesoMaximoEmGramas: limiteOpcionalNumeroInteiroPositivo,
  alturaMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  larguraMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  comprimentoMaximoEmCm: limiteOpcionalNumeroInteiroPositivo,
});

export const editarTransportadoraFreteSchema = z.object({
  identificador: identificadorSchema.optional(),
  nome: nomeSchema.optional(),
  ativo: z.boolean().optional(),
  pesoMaximoEmGramas: limiteOpcionalNumeroInteiroPositivo,
  alturaMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  larguraMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  comprimentoMaximoEmCm: limiteOpcionalNumeroInteiroPositivo,
  provedorFreteId: z.string().uuid("Provedor de frete inválido").optional(),
});

export const criarServicoFreteSchema = z.object({
  provedorFreteId: z
    .string()
    .uuid("Provedor de frete inválido")
    .min(1, "Provedor de frete é obrigatório"),
  transportadoraFreteId: z
    .string()
    .uuid("Transportadora inválida")
    .nullable()
    .optional(),
  identificador: identificadorSchema,
  nome: nomeSchema,
  ativo: z.boolean().optional().default(true),
  pesoMaximoEmGramas: limiteOpcionalNumeroInteiroPositivo,
  alturaMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  larguraMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  comprimentoMaximoEmCm: limiteOpcionalNumeroInteiroPositivo,
});

export const editarServicoFreteSchema = z.object({
  identificador: identificadorSchema.optional(),
  nome: nomeSchema.optional(),
  ativo: z.boolean().optional(),
  provedorFreteId: z.string().uuid("Provedor de frete inválido").optional(),
  transportadoraFreteId: z
    .string()
    .uuid("Transportadora inválida")
    .nullable()
    .optional(),
  pesoMaximoEmGramas: limiteOpcionalNumeroInteiroPositivo,
  alturaMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  larguraMaximaEmCm: limiteOpcionalNumeroInteiroPositivo,
  comprimentoMaximoEmCm: limiteOpcionalNumeroInteiroPositivo,
});

