import { z } from "zod";

export const cancelarPedidoClienteSchema = z
  .object({
    pedidoId: z.uuid("Pedido inválido."),
    motivo: z.enum([
      "compra_por_engano",
      "alterar_pedido",
      "prazo_entrega",
      "outra_opcao",
      "problema_pagamento",
      "outro",
    ]),
    complementoMotivo: z.string().trim().max(500).optional(),
  })
  .refine(
    ({ motivo, complementoMotivo }) =>
      motivo !== "outro" || Boolean(complementoMotivo?.length),
    { message: "Explique brevemente o motivo.", path: ["complementoMotivo"] },
  );

export type MotivoCancelamentoPedido = z.infer<
  typeof cancelarPedidoClienteSchema
>["motivo"];
