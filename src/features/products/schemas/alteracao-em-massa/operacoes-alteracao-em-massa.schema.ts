import { z } from "zod";

export const modalidadesPrecoSchema = z.enum([
  "stock",
  "preSale",
  "dropshipping",
  "orderBasis",
]);

export const operacaoNumericaSchema = z.enum([
  "definir",
  "aumentar",
  "reduzir",
]);

export const operacaoPrecoSchema = z.enum([
  "definir",
  "aumentar_valor",
  "reduzir_valor",
  "aumentar_percentual",
  "reduzir_percentual",
]);

export const ncmSchema = z
  .string()
  .trim()
  .regex(/^\d{4}\.?\d{2}\.?\d{2}$/, "Informe os 8 dígitos do NCM.");

export const operacaoAlteracaoEmMassaSchema = z.discriminatedUnion("campo", [
  z.object({ campo: z.literal("status"), valor: z.boolean() }),
  z.object({ campo: z.literal("categoria"), categoriaId: z.string().uuid() }),
  z.object({ campo: z.literal("marca"), marcaId: z.string().uuid() }),
  z.object({
    campo: z.literal("secoes"),
    operacao: z.enum(["adicionar", "remover", "substituir"]),
    secoesIds: z.array(
      z.enum(["general", "new", "sale", "featured", "bestseller"]),
    ),
  }),
  z.object({
    campo: z.literal("preco"),
    modalidade: modalidadesPrecoSchema,
    operacao: operacaoPrecoSchema,
    valor: z.number().nonnegative(),
  }),
  z.object({
    campo: z.literal("prazo"),
    modalidade: modalidadesPrecoSchema,
    valor: z.string().trim().min(1).max(120),
  }),
  z.object({
    campo: z.literal("estoque"),
    operacao: operacaoNumericaSchema,
    valor: z.number().int().nonnegative(),
  }),
  z.object({ campo: z.literal("ncm"), valor: ncmSchema }),
  z.object({
    campo: z.literal("peso"),
    operacao: z.enum(["definir", "limpar"]),
    valor: z.number().nonnegative(),
  }),
  z.object({
    campo: z.literal("altura"),
    operacao: z.enum(["definir", "limpar"]),
    valor: z.number().int().nonnegative(),
  }),
  z.object({
    campo: z.literal("largura"),
    operacao: z.enum(["definir", "limpar"]),
    valor: z.number().int().nonnegative(),
  }),
  z.object({
    campo: z.literal("comprimento"),
    operacao: z.enum(["definir", "limpar"]),
    valor: z.number().int().nonnegative(),
  }),
]);

export const operacoesAlteracaoEmMassaSchema = z
  .array(operacaoAlteracaoEmMassaSchema)
  .min(1)
  .max(20)
  .superRefine((operacoes, contexto) => {
    const campos = new Set<string>();
    operacoes.forEach((operacao, indice) => {
      if (campos.has(operacao.campo)) {
        contexto.addIssue({
          code: "custom",
          path: [indice, "campo"],
          message: "Não repita o mesmo campo na alteração em massa.",
        });
      }
      campos.add(operacao.campo);
    });
  });

export type OperacaoAlteracaoEmMassa = z.infer<
  typeof operacaoAlteracaoEmMassaSchema
>;

export const solicitarPreviewAlteracaoEmMassaSchema = z.object({
  produtosIds: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Não repita produtos na seleção.",
    }),
  operacoes: operacoesAlteracaoEmMassaSchema,
});

export const aplicarAlteracaoEmMassaSchema =
  solicitarPreviewAlteracaoEmMassaSchema.extend({
    assinaturaPreview: z.string().min(32),
  });

export type SolicitarPreviewAlteracaoEmMassa = z.infer<
  typeof solicitarPreviewAlteracaoEmMassaSchema
>;
