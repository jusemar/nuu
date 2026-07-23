const formatadorMonetarioBrasileiro = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
