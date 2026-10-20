import { z } from "zod";

import { itemCheckoutSchema, selecaoEntregaGrupoSchema } from "@/features/checkout/schemas/checkout.schema";

/** A identidade não integra a entrada: só a sessão decide qual carteira consultar. */
export const previaRecompensaSchema = z.object({
  item: itemCheckoutSchema.refine((item) => item.quantidade === 1, "A recompensa exige quantidade 1."),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido."),
  cidade: z.string().trim().min(2),
  estado: z.string().trim().length(2),
  selecoesEntregaPorGrupo: z.array(selecaoEntregaGrupoSchema).min(1),
});

export type EntradaPreviaRecompensa = z.infer<typeof previaRecompensaSchema>;
