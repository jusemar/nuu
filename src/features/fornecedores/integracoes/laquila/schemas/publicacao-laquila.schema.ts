import { z } from "zod";

export const publicarProdutosLaquilaSchema = z.object({
  rascunhoIds: z.array(z.uuid()).min(1).max(50),
});

export type EntradaPublicarProdutosLaquila = z.infer<
  typeof publicarProdutosLaquilaSchema
>;
