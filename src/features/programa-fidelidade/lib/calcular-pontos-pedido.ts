export type ItemElegivelFidelidade = {
  id: string;
  categoriaId: string;
  valorBrutoEmCentavos: number;
  ativa: boolean;
  origemRegra: "global" | "personalizada";
  taxaPontosPorReal: string;
  creditoFidelidadeRateadoEmCentavos?: number;
};

export type CalculoItemFidelidade = ItemElegivelFidelidade & {
  descontoRateadoEmCentavos: number;
  valorBaseEmCentavos: number;
  pontos: string;
};

function taxaEmUnidades(taxa: string) {
  const [inteira = "0", decimal = ""] = taxa.split(".");
  return (
    BigInt(inteira) * BigInt(10_000) +
    BigInt(decimal.padEnd(4, "0").slice(0, 4))
  );
}

function formatarPontos(unidades: bigint) {
  const inteira = unidades / BigInt(10_000);
  const decimal = String(unidades % BigInt(10_000)).padStart(4, "0");
  return `${inteira}.${decimal}`;
}

/** Arredondamento half-up para quatro casas, reproduzível sem ponto flutuante. */
export function calcularPontosPorValor({
  valorEmCentavos,
  taxaPontosPorReal,
}: {
  valorEmCentavos: number;
  taxaPontosPorReal: string;
}) {
  const numerador = BigInt(valorEmCentavos) * taxaEmUnidades(taxaPontosPorReal);
  return formatarPontos((numerador + BigInt(50)) / BigInt(100));
}

/**
 * Rateia o cupom pelo método das maiores sobras. A soma das parcelas sempre é
 * exatamente o desconto original; empates usam o id do item como desempate estável.
 */
export function ratearCupomEntreItens({
  itens,
  descontoCupomEmCentavos,
}: {
  itens: Array<{ id: string; valorBrutoEmCentavos: number }>;
  descontoCupomEmCentavos: number;
}) {
  const total = itens.reduce(
    (soma, item) => soma + item.valorBrutoEmCentavos,
    0,
  );
  const desconto = Math.min(Math.max(descontoCupomEmCentavos, 0), total);
  if (total === 0 || desconto === 0) {
    return new Map(itens.map((item) => [item.id, 0]));
  }

  const parcelas = itens.map((item) => {
    const numerador = BigInt(desconto) * BigInt(item.valorBrutoEmCentavos);
    return {
      id: item.id,
      parcela: Number(numerador / BigInt(total)),
      resto: numerador % BigInt(total),
    };
  });
  let faltantes =
    desconto - parcelas.reduce((soma, item) => soma + item.parcela, 0);
  const prioridade = [...parcelas].sort((a, b) =>
    a.resto === b.resto ? a.id.localeCompare(b.id) : a.resto > b.resto ? -1 : 1,
  );
  for (let indice = 0; faltantes > 0; indice += 1, faltantes -= 1) {
    prioridade[indice]!.parcela += 1;
  }
  return new Map(parcelas.map((item) => [item.id, item.parcela]));
}

export function calcularPontosItensPedido({
  itens,
  descontoCupomEmCentavos,
}: {
  itens: ItemElegivelFidelidade[];
  descontoCupomEmCentavos: number;
}): CalculoItemFidelidade[] {
  const rateio = ratearCupomEntreItens({ itens, descontoCupomEmCentavos });
  return itens.flatMap((item) => {
    if (!item.ativa) return [];
    const descontoRateadoEmCentavos =
      (rateio.get(item.id) ?? 0) +
      (item.creditoFidelidadeRateadoEmCentavos ?? 0);
    const valorBaseEmCentavos = Math.max(
      item.valorBrutoEmCentavos - descontoRateadoEmCentavos,
      0,
    );
    const pontos = calcularPontosPorValor({
      valorEmCentavos: valorBaseEmCentavos,
      taxaPontosPorReal: item.taxaPontosPorReal,
    });
    if (pontos === "0.0000") return [];
    return [
      { ...item, descontoRateadoEmCentavos, valorBaseEmCentavos, pontos },
    ];
  });
}
