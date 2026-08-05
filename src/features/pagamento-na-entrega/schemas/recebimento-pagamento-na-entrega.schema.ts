import { z } from "zod";

/** Formas que o entregador pode ter efetivamente recebido. */
export const formaRecebidaSchema = z.enum([
  "dinheiro",
  "pix_na_entrega",
  "debito_entrega",
  "credito_entrega",
]);

/**
 * Converte reais digitados para centavos.
 *
 * `Math.round` no fim é obrigatório: `50.9 * 100` dá `5089.999...` em ponto flutuante, e
 * truncar registraria R$ 50,89 no caixa.
 */
function converterReaisParaCentavos(valor: string): number | null {
  const texto = valor.trim();

  if (texto === "") return null;

  const numero = Number(texto);

  return Number.isFinite(numero) ? Math.round(numero * 100) : null;
}

export const confirmarRecebimentoPagamentoEntregaSchema = z.object({
  pedidoId: z.string().uuid("Pedido inválido."),
  /**
   * Forma REALMENTE recebida, que pode diferir da escolhida no checkout — o cliente disse
   * dinheiro e pagou no débito. É por isso que o campo existe separado: o caixa precisa
   * refletir o que aconteceu, não o que foi combinado.
   */
  formaRecebida: formaRecebidaSchema,
  /**
   * Valor efetivamente recebido, sempre explícito.
   *
   * Nunca assumido a partir do total: divergência entre combinado e recebido é justamente
   * o que a conferência de caixa precisa enxergar.
   */
  valorRecebidoEmCentavos: z
    .string()
    .transform((valor) => converterReaisParaCentavos(valor))
    .refine((centavos) => centavos !== null && centavos > 0, {
      message: "Informe o valor recebido.",
    })
    // O `refine` acima já garante que não é nulo, mas ele não estreita o tipo. Este
    // segundo `transform` faz isso explicitamente, para o consumidor receber `number`.
    .transform((centavos) => centavos as number),
  observacao: z
    .string()
    .max(500, "Use no máximo 500 caracteres.")
    .optional()
    .transform((valor) => {
      const texto = valor?.trim() ?? "";
      return texto === "" ? null : texto;
    }),
});

/** Motivos pelos quais um pagamento na entrega não se concretiza. */
export const motivoNaoRecebimentoSchema = z.enum([
  "pagamento_recusado",
  "entrega_nao_realizada",
]);

export const registrarNaoRecebimentoPagamentoEntregaSchema = z.object({
  pedidoId: z.string().uuid("Pedido inválido."),
  motivo: motivoNaoRecebimentoSchema,
  // Obrigatória aqui, ao contrário da confirmação: cancelar um pedido sem explicar por quê
  // deixa a operação sem como auditar depois.
  observacao: z
    .string()
    .trim()
    .min(5, "Descreva o que aconteceu.")
    .max(500, "Use no máximo 500 caracteres."),
});

export const estornarRecebimentoPagamentoEntregaSchema = z.object({
  pedidoId: z.string().uuid("Pedido inválido."),
  observacao: z
    .string()
    .trim()
    .min(5, "Explique o motivo do estorno.")
    .max(500, "Use no máximo 500 caracteres."),
});

export type MotivoNaoRecebimento = z.infer<typeof motivoNaoRecebimentoSchema>;

export const ROTULO_MOTIVO_NAO_RECEBIMENTO: Record<
  MotivoNaoRecebimento,
  string
> = {
  pagamento_recusado: "Pagamento recusado na entrega",
  entrega_nao_realizada: "Entrega não realizada",
};
