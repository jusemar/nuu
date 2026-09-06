export function converterValorPixEmCentavos(valor: string | undefined) {
  if (!valor || !/^\d+(?:\.\d{1,2})?$/.test(valor)) return null;

  const [reais, centavos = ""] = valor.split(".");
  const total = Number(reais) * 100 + Number(centavos.padEnd(2, "0"));

  return Number.isSafeInteger(total) ? total : null;
}

export function valorPixCorrespondeAoPagamento({
  valorRecebido,
  valorEsperadoEmCentavos,
}: {
  valorRecebido: string | undefined;
  valorEsperadoEmCentavos: number;
}) {
  return converterValorPixEmCentavos(valorRecebido) === valorEsperadoEmCentavos;
}
