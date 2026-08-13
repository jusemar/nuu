import { z } from "zod";

export const produtoIdVendaCruzadaSchema = z
  .string()
  .uuid("Identificador de produto inválido.");

export const buscarProdutosVendaCruzadaSchema = z.object({
  produtoPrincipalId: produtoIdVendaCruzadaSchema,
  busca: z.string().trim().max(100, "A busca é muito longa."),
  limite: z.number().int().min(1).max(20).default(12),
});

export const salvarVendaCruzadaSchema = z
  .object({
    produtoPrincipalId: produtoIdVendaCruzadaSchema,
    ativa: z.boolean(),
    produtosIds: z
      .array(produtoIdVendaCruzadaSchema)
      .max(4, "Selecione no máximo quatro produtos."),
  })
  .superRefine((dados, contexto) => {
    if (new Set(dados.produtosIds).size !== dados.produtosIds.length) {
      contexto.addIssue({
        code: "custom",
        path: ["produtosIds"],
        message: "Um produto não pode aparecer mais de uma vez.",
      });
    }

    if (dados.produtosIds.includes(dados.produtoPrincipalId)) {
      contexto.addIssue({
        code: "custom",
        path: ["produtosIds"],
        message: "O produto não pode ser relacionado a ele mesmo.",
      });
    }
  });
