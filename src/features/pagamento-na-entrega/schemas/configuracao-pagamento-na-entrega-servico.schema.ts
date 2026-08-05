import { z } from "zod";

/**
 * Converte o valor digitado no formulário (em reais) para centavos.
 *
 * O formulário usa `<input type="number" step="0.01">`, então o que chega é sempre uma
 * string decimal com ponto (`"50.9"`), e não o texto mascarado em pt-BR que o admin de
 * promoções precisa tratar. São necessidades diferentes, por isso a conversão aqui é
 * própria e minúscula em vez de reaproveitar o parser de máscara.
 *
 * `Math.round` no fim é obrigatório: `50.9 * 100` dá `5089.999...` em ponto flutuante, e
 * truncar produziria R$ 50,89 no banco.
 */
function converterReaisParaCentavos(valor: string): number | null {
  const texto = valor.trim();

  if (texto === "") return null;

  const numero = Number(texto);

  if (!Number.isFinite(numero)) return null;

  return Math.round(numero * 100);
}

/**
 * Campo monetário opcional.
 *
 * Vazio significa "sem limite", que é diferente de zero — zero seria um limite de R$ 0,00
 * e travaria tudo. Por isso o vazio vira `null` e não `0`.
 */
const valorMonetarioOpcional = z
  .string()
  .optional()
  .transform((valor) => converterReaisParaCentavos(valor ?? ""))
  .refine((centavos) => centavos === null || centavos >= 0, {
    message: "Informe um valor igual ou maior que zero.",
  })
  .refine((centavos) => centavos === null || Number.isInteger(centavos), {
    message: "Informe um valor monetário válido.",
  });

/**
 * Checkbox de formulário HTML.
 *
 * Um checkbox desmarcado simplesmente não é enviado no `FormData` — o campo chega como
 * `null`, não como `"false"`. Por isso a conversão trata qualquer ausência como `false`.
 */
const booleanoDeFormulario = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((valor) => valor === "on" || valor === "true");

export const salvarConfiguracaoPagamentoNaEntregaServicoSchema = z
  .object({
    servicoFreteId: z.string().uuid("Serviço de entrega inválido."),
    aceitaPagamentoNaEntrega: booleanoDeFormulario,
    aceitaDinheiro: booleanoDeFormulario,
    aceitaPixNaEntrega: booleanoDeFormulario,
    aceitaDebito: booleanoDeFormulario,
    aceitaCredito: booleanoDeFormulario,
    valorMinimoPedidoEmCentavos: valorMonetarioOpcional,
    valorMaximoPedidoEmCentavos: valorMonetarioOpcional,
    valorMaximoDinheiroEmCentavos: valorMonetarioOpcional,
    exigeTroco: booleanoDeFormulario,
    observacoesCliente: z
      .string()
      .max(500, "Use no máximo 500 caracteres.")
      .optional()
      .transform((valor) => {
        const texto = valor?.trim() ?? "";
        return texto === "" ? null : texto;
      }),
    ativo: booleanoDeFormulario,
  })
  // Ligar o serviço sem habilitar nenhuma forma criaria uma configuração que parece ativa
  // na tela mas nunca autoriza nada. Melhor barrar no formulário do que deixar o gestor
  // achar que configurou.
  .refine(
    (dados) =>
      !dados.aceitaPagamentoNaEntrega ||
      dados.aceitaDinheiro ||
      dados.aceitaPixNaEntrega ||
      dados.aceitaDebito ||
      dados.aceitaCredito,
    {
      message: "Habilite ao menos uma forma de pagamento na entrega.",
      path: ["aceitaDinheiro"],
    },
  )
  .refine(
    (dados) =>
      dados.valorMinimoPedidoEmCentavos === null ||
      dados.valorMaximoPedidoEmCentavos === null ||
      dados.valorMinimoPedidoEmCentavos <= dados.valorMaximoPedidoEmCentavos,
    {
      message: "O valor mínimo não pode ser maior que o máximo.",
      path: ["valorMinimoPedidoEmCentavos"],
    },
  )
  // O teto de dinheiro acima do teto geral seria letra morta: o limite geral derrubaria o
  // pedido antes. Sinalizar evita uma configuração que o gestor acha que está valendo.
  .refine(
    (dados) =>
      dados.valorMaximoDinheiroEmCentavos === null ||
      dados.valorMaximoPedidoEmCentavos === null ||
      dados.valorMaximoDinheiroEmCentavos <= dados.valorMaximoPedidoEmCentavos,
    {
      message:
        "O limite de dinheiro não pode ser maior que o valor máximo do pedido.",
      path: ["valorMaximoDinheiroEmCentavos"],
    },
  );

export type DadosSalvarConfiguracaoPagamentoNaEntregaServico = z.infer<
  typeof salvarConfiguracaoPagamentoNaEntregaServicoSchema
>;

/** Lê um `FormData` no formato que o schema espera. Usado nos dois lados da validação. */
export function extrairDadosFormularioConfiguracao(formData: FormData) {
  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor : undefined;
  };

  return {
    servicoFreteId: texto("servicoFreteId") ?? "",
    aceitaPagamentoNaEntrega: texto("aceitaPagamentoNaEntrega") ?? null,
    aceitaDinheiro: texto("aceitaDinheiro") ?? null,
    aceitaPixNaEntrega: texto("aceitaPixNaEntrega") ?? null,
    aceitaDebito: texto("aceitaDebito") ?? null,
    aceitaCredito: texto("aceitaCredito") ?? null,
    valorMinimoPedidoEmCentavos: texto("valorMinimoPedidoEmCentavos"),
    valorMaximoPedidoEmCentavos: texto("valorMaximoPedidoEmCentavos"),
    valorMaximoDinheiroEmCentavos: texto("valorMaximoDinheiroEmCentavos"),
    exigeTroco: texto("exigeTroco") ?? null,
    observacoesCliente: texto("observacoesCliente"),
    ativo: texto("ativo") ?? null,
  };
}
