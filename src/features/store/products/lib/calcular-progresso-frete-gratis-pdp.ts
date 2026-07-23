export type EntradaProgressoFreteGratisPdp = {
  valorUnitarioEmCentavos: number | null | undefined;
  quantidade: number;
  subtotalMinimoEmReais: number;
};

export type ProgressoFreteGratisPdp = {
  disponivel: boolean;
  subtotalEmCentavos: number | null;
  subtotalMinimoEmCentavos: number | null;
  atingido: boolean;
  faltanteEmCentavos: number | null;
  percentual: number;
};

/** Calcula somente a barra informativa da PDP; a elegibilidade oficial segue server-side. */
export function calcularProgressoFreteGratisPdp({
  valorUnitarioEmCentavos,
  quantidade,
  subtotalMinimoEmReais,
}: EntradaProgressoFreteGratisPdp): ProgressoFreteGratisPdp {
  const possuiQuantidadeValida =
    Number.isSafeInteger(quantidade) && quantidade > 0;
  const possuiMetaValida =
    Number.isFinite(subtotalMinimoEmReais) && subtotalMinimoEmReais > 0;

  if (
    typeof valorUnitarioEmCentavos !== "number" ||
    !Number.isSafeInteger(valorUnitarioEmCentavos) ||
    valorUnitarioEmCentavos < 0 ||
    !possuiQuantidadeValida ||
    !possuiMetaValida
  ) {
    return {
      disponivel: false,
      subtotalEmCentavos: null,
      subtotalMinimoEmCentavos: null,
      atingido: false,
      faltanteEmCentavos: null,
      percentual: 0,
    };
  }

  const subtotalEmCentavos = valorUnitarioEmCentavos * quantidade;
  const subtotalMinimoEmCentavos = Math.round(subtotalMinimoEmReais * 100);
  const atingido = subtotalEmCentavos >= subtotalMinimoEmCentavos;

  return {
    disponivel: true,
    subtotalEmCentavos,
    subtotalMinimoEmCentavos,
    atingido,
    faltanteEmCentavos: Math.max(
      subtotalMinimoEmCentavos - subtotalEmCentavos,
      0,
    ),
    percentual: Math.min(
      Math.round((subtotalEmCentavos / subtotalMinimoEmCentavos) * 100),
      100,
    ),
  };
}
