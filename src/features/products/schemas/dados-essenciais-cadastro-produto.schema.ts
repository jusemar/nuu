import { z } from "zod";

import { productKindSchema } from "./product-variants.schema";

/** Campos obrigatórios do cadastro, validados antes de qualquer escrita. */
export const dadosEssenciaisCadastroProdutoSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto."),
  slug: z.string().trim().min(1, "Informe o slug do produto."),
  sku: z.string().trim().min(1, "Informe o SKU do produto."),
  description: z.string().trim().min(1, "Informe a descrição do produto."),
  categoryId: z.string().uuid("Selecione uma categoria válida."),
  images: z.array(
    z.object({
      url: z.string().optional(),
      isPrimary: z.boolean(),
      altText: z.string().optional(),
    }),
    { message: "As imagens do produto são inválidas." },
  ),
  productKind: productKindSchema.optional(),
});
