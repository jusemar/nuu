/** Usa o rateio já congelado pelo checkout; nunca consulta catálogo ou distribui outro desconto. */
export function baseComissionavelItem(item: {
  quantidade: number;
  precoComercialUnitarioEmCentavos: number | null;
  descontoCupomRateadoEmCentavos: number | null;
  creditoFidelidadeRateadoEmCentavos: number;
}) {
  const preco = item.precoComercialUnitarioEmCentavos,
    cupom = item.descontoCupomRateadoEmCentavos;
  if (preco === null || cupom === null)
    throw new Error(
      "Item sem base comercial congelada; não é possível atribuir retroativamente.",
    );
  for (const valor of [
    preco,
    cupom,
    item.quantidade,
    item.creditoFidelidadeRateadoEmCentavos,
  ])
    if (!Number.isSafeInteger(valor) || valor < 0)
      throw new Error("Base comercial inválida.");
  if (item.quantidade < 1) throw new Error("Quantidade inválida.");
  const bruto = BigInt(preco) * BigInt(item.quantidade);
  const desconto =
    BigInt(cupom) + BigInt(item.creditoFidelidadeRateadoEmCentavos);
  const aplicado = desconto > bruto ? bruto : desconto;
  if (bruto > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Base comercial excede o limite seguro.");
  return {
    quantidade: item.quantidade,
    precoUnitarioVendidoCentavos: preco,
    descontoItemCentavos: Number(aplicado),
    valorLiquidoItemCentavos: Number(bruto - aplicado),
  };
}
