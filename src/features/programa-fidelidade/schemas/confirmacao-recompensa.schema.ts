import { z } from "zod";

import { selecaoEntregaGrupoSchema } from "@/features/checkout/schemas/checkout.schema";

export const confirmacaoRecompensaSchema = z.object({
  varianteId: z.string(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido."),
  rua: z.string().trim().min(3, "Informe a rua."),
  numero: z.string().trim().min(1, "Informe o número."),
  complemento: z.string(),
  bairro: z.string().trim().min(2, "Informe o bairro."),
  cidade: z.string().trim().min(2, "Informe a cidade."),
  estado: z.string().trim().length(2, "Informe a UF."),
  selecoesEntregaPorGrupo: z.array(selecaoEntregaGrupoSchema).min(1, "Selecione a entrega."),
});

export type ConfirmacaoRecompensa = z.infer<typeof confirmacaoRecompensaSchema>;
