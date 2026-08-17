type DimensoesRascunhoFornecedor = {
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
};

function converterNumeroPositivo(valor: string | null) {
  if (valor === null || !valor.trim()) return null;
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

/** Converte exclusivamente dimensões da API Laquila, cuja unidade é metro. */
export function converterMetrosLaquilaParaCentimetros(valor: string | null) {
  const metros = converterNumeroPositivo(valor);
  if (metros === null) return null;

  return Math.round(metros * 100);
}

/** Mantém a conversão histórica correta do peso Laquila: quilogramas para gramas. */
export function converterQuilogramasLaquilaParaGramas(valor: string | null) {
  const quilogramas = converterNumeroPositivo(valor);
  if (quilogramas === null) return null;

  return Math.round(quilogramas * 1000);
}

/**
 * Isola a convenção da Laquila sem afetar rascunhos manuais ou importados por
 * Excel, que podem já informar dimensões em centímetros.
 */
export function prepararDimensoesPublicacaoFornecedor({
  origemTipo,
  origemProvedor,
  dimensoes,
}: {
  origemTipo: "manual" | "fornecedor_api" | "fornecedor_excel";
  origemProvedor: string;
  dimensoes: DimensoesRascunhoFornecedor;
}) {
  if (origemTipo !== "fornecedor_api" || origemProvedor !== "laquila") {
    return {
      pesoEmKg: dimensoes.peso,
      alturaEmCm: dimensoes.altura,
      larguraEmCm: dimensoes.largura,
      comprimentoEmCm: dimensoes.comprimento,
    };
  }

  const converterDimensao = (valor: string | null) => {
    const centimetros = converterMetrosLaquilaParaCentimetros(valor);
    return centimetros === null ? null : String(centimetros);
  };

  return {
    // O cadastro compartilhado já converte este valor de kg para g.
    pesoEmKg: dimensoes.peso,
    alturaEmCm: converterDimensao(dimensoes.altura),
    larguraEmCm: converterDimensao(dimensoes.largura),
    comprimentoEmCm: converterDimensao(dimensoes.comprimento),
  };
}
