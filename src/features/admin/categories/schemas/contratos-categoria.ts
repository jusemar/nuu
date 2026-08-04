import { z } from "zod";

const slugCategoriaSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido.");

const textoOpcional = z.string().trim().max(10000).nullable().optional();

export const criarCategoriaSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugCategoriaSchema,
  description: textoOpcional,
  descriptionBottom: textoOpcional.describe(
    "HTML editorial ainda não sanitizado.",
  ),
  parentId: z.string().uuid().nullable().optional(),
  level: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  imageUrl: z.string().url().nullable().optional(),
  metaTitle: z.string().trim().max(60).nullable().optional(),
  metaDescription: z.string().trim().max(160).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const atualizarCategoriaSchema = criarCategoriaSchema.partial();

const faqBaseSchema = z.object({
  categoryId: z.string().uuid(),
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(10000),
  orderIndex: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const criarFaqCategoriaSchema = faqBaseSchema;
export const atualizarFaqCategoriaSchema = faqBaseSchema
  .omit({ categoryId: true })
  .partial();
export const reordenarFaqsCategoriaSchema = z
  .array(
    z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(0) }),
  )
  .min(1)
  .superRefine((itens, contexto) => {
    const ids = itens.map((item) => item.id);
    const indices = itens.map((item) => item.orderIndex);
    if (new Set(ids).size !== ids.length)
      contexto.addIssue({ code: "custom", message: "FAQ_DUPLICADA_NA_ORDEM" });
    if (new Set(indices).size !== indices.length)
      contexto.addIssue({
        code: "custom",
        message: "INDICE_DUPLICADO_NA_ORDEM",
      });
    if (
      ![...indices]
        .sort((a, b) => a - b)
        .every((valor, indice) => valor === indice)
    )
      contexto.addIssue({ code: "custom", message: "ORDEM_DEVE_SER_CONTIGUA" });
  });
export const alterarStatusFaqCategoriaSchema = z.object({
  isActive: z.boolean(),
});
export const excluirFaqCategoriaSchema = z.object({ id: z.string().uuid() });
