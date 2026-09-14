import { z } from "zod";

/** Um destino com condições comerciais de Entrega Própria (Produto/Categoria). */
export const precoDestinoEntregaPropriaSchema = z
  .object({
    destinationType: z.enum(["region", "bairro", "cep-especifico", "cidade"]),
    destinationId: z.number().int().positive("Destino inválido."),
    shippingPrice: z.number().int().min(0, "Preço da rápida inválido."),
    rapidDeliveryActive: z.boolean().default(true),
    deliveryDeadline: z.string().trim().max(100).nullable().optional(),
    scheduledDeliveryActive: z.boolean().default(false),
    scheduledDeliveryMinDays: z.number().int().min(0).nullable().optional(),
    // 0 é válido: programada grátis.
    scheduledDeliveryPrice: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (item) =>
      !item.scheduledDeliveryActive ||
      (item.scheduledDeliveryMinDays != null &&
        item.scheduledDeliveryPrice != null),
    "Programada ativa exige janelas e preço (use 0 para grátis).",
  );

export const salvarEntregaPropriaCategoriaSchema = z
  .object({
    categoriaId: z.string().uuid("Categoria inválida."),
    modo: z.enum(["herdar", "ativado", "desativado"], {
      message: "Escolha Herdar, Ativado ou Desativado.",
    }),
    precos: z.array(precoDestinoEntregaPropriaSchema).max(500),
  })
  .refine(
    (dados) =>
      new Set(
        dados.precos.map((p) => `${p.destinationType}:${p.destinationId}`),
      ).size === dados.precos.length,
    "Há destinos repetidos na configuração.",
  );

export type SalvarEntregaPropriaCategoriaInput = z.infer<
  typeof salvarEntregaPropriaCategoriaSchema
>;
