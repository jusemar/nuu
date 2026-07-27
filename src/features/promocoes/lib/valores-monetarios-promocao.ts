const formatadorMonetarioBrasileiro = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type TipoDescontoMonetario = "percentual" | "valor_fixo";

/** Mantém no campo apenas caracteres aceitos pela máscara monetária brasileira. */
export function sanitizarEntradaValorMonetario(valor: string): string {
  return valor.replace(/[^0-9,.]/g, "");
}

/** Converte centavos persistidos em uma representação editável em reais. */
export function formatarCentavosComoValorMonetario(
  valorEmCentavos: number,
): string {
  return formatadorMonetarioBrasileiro.format(valorEmCentavos / 100);
}

/**
 * Aceita valores monetários brasileiros sem depender de valores formatados da UI.
 * Retorna null para entrada vazia ou inválida, preservando a validação no cliente.
 */
export function converterValorMonetarioParaCentavos(
  valor: string,
): number | null {
  const valorNormalizado = valor
    .replace(/^R\$\s*/i, "")
    .trim()
    .replace(/\s/g, "");

  if (!valorNormalizado || valorNormalizado.includes("-")) return null;

  const formatoValido = /^\d+(?:\.\d{3})*(?:,\d{0,2})?$/.test(valorNormalizado);
  if (!formatoValido) return null;

  const [parteInteira, parteDecimal = ""] = valorNormalizado.split(",");
  const inteiro = Number(parteInteira.replaceAll(".", ""));
  const centavos = Number(parteDecimal.padEnd(2, "0"));
  const resultado = inteiro * 100 + centavos;

  return Number.isSafeInteger(resultado) && resultado >= 0 ? resultado : null;
}

/** Normaliza uma entrada válida para duas casas decimais, preservando a UI em reais. */
export function formatarValorMonetarioParaEdicao(valor: string): string | null {
  const valorEmCentavos = converterValorMonetarioParaCentavos(valor);

  return valorEmCentavos === null
    ? null
    : formatarCentavosComoValorMonetario(valorEmCentavos);
}

/** Preserva o valor equivalente ao alternar o tipo de desconto no formulário. */
export function converterValorDescontoEntreTipos(
  valor: number | string,
  tipoOrigem: TipoDescontoMonetario,
  tipoDestino: TipoDescontoMonetario,
): number | string {
  if (tipoOrigem === tipoDestino) return valor;

  if (tipoDestino === "valor_fixo") {
    return formatarCentavosComoValorMonetario(Number(valor));
  }

  return (converterValorMonetarioParaCentavos(String(valor)) ?? 0) / 100;
}
