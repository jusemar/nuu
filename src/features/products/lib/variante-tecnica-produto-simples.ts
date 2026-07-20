export type VarianteParaIdentificacaoTecnica = {
  id: string;
  sku: string;
  atributos: Record<string, string>;
  precoEmCentavos: number;
  estoque: number;
  ativa: boolean;
  principal: boolean;
};

export type ResultadoVarianteTecnicaProdutoSimples =
  | {
      situacao: "confiavel";
      variante: VarianteParaIdentificacaoTecnica;
    }
  | {
      situacao:
        | "ausente"
        | "duplicada"
        | "inativa"
        | "sem_padrao"
        | "sku_inconsistente"
        | "atributos_inconsistentes"
        | "dados_incompletos";
      motivo: string;
    };

/**
 * Produto simples usa exatamente uma variante interna, sem atributos.
 * A identificação é deliberadamente estrita para nunca escolher um registro
 * ambíguo e alterar estoque de uma variante real por engano.
 */
export function identificarVarianteTecnicaProdutoSimples({
  skuProduto,
  variantes,
}: {
  skuProduto: string;
  variantes: VarianteParaIdentificacaoTecnica[];
}): ResultadoVarianteTecnicaProdutoSimples {
  if (variantes.length === 0) {
    return {
      situacao: "ausente",
      motivo: "Produto simples sem variante técnica cadastrada.",
    };
  }

  if (variantes.length > 1) {
    return {
      situacao: "duplicada",
      motivo: `Produto simples possui ${variantes.length} registros internos; deveria possuir exatamente um.`,
    };
  }

  const variante = variantes[0]!;
  if (!variante.ativa) {
    return {
      situacao: "inativa",
      motivo: "A variante técnica do produto simples está inativa.",
    };
  }
  if (!variante.principal) {
    return {
      situacao: "sem_padrao",
      motivo:
        "A variante técnica do produto simples não está marcada como padrão.",
    };
  }
  if (variante.sku !== skuProduto) {
    return {
      situacao: "sku_inconsistente",
      motivo: "O SKU da variante técnica difere do SKU do produto simples.",
    };
  }
  if (Object.keys(variante.atributos).length > 0) {
    return {
      situacao: "atributos_inconsistentes",
      motivo:
        "A variante técnica do produto simples possui atributos de variante real.",
    };
  }
  if (
    !Number.isSafeInteger(variante.precoEmCentavos) ||
    variante.precoEmCentavos < 0 ||
    !Number.isSafeInteger(variante.estoque) ||
    variante.estoque < 0
  ) {
    return {
      situacao: "dados_incompletos",
      motivo: "A variante técnica possui preço ou estoque inválido.",
    };
  }

  return { situacao: "confiavel", variante };
}

export function resumirEstoqueVariantesProduto(
  variantes: Array<{ estoque: number; ativa: boolean }>,
) {
  const quantidades = variantes
    .filter(
      (variante) =>
        variante.ativa &&
        Number.isSafeInteger(variante.estoque) &&
        variante.estoque >= 0,
    )
    .map((variante) => variante.estoque);

  if (quantidades.length === 0) return null;
  const minimo = Math.min(...quantidades);
  const maximo = Math.max(...quantidades);

  return {
    variantesAtivas: quantidades.length,
    minimo,
    maximo,
    rotulo:
      minimo === maximo
        ? `${quantidades.length} variante(s) · ${minimo} un.`
        : `${quantidades.length} variante(s) · ${minimo}–${maximo} un.`,
  };
}
