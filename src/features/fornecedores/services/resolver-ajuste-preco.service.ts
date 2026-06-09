import type {
  AjustePrecoImportacaoFornecedor,
  OrigemAjustePrecoFornecedor,
  ResultadoCalculoAjustePrecoFornecedor,
  TipoAjustePrecoFornecedor,
} from "../types/fornecedores.types";

type LinhaPrecoFornecedor = {
  id: string;
  categoriaFornecedor: string | null;
  precoFornecedor: string | null;
  precoOriginal: string | null;
};

type AjustesPorEscopo = {
  global: AjustePrecoImportacaoFornecedor | null;
  categorias: Map<string, AjustePrecoImportacaoFornecedor>;
  produtos: Map<string, AjustePrecoImportacaoFornecedor>;
};

function normalizarNumeroDecimal(valor: string) {
  return Number(valor.replace(",", "."));
}

function formatarPreco(valor: number) {
  return valor.toFixed(2);
}

function aplicarAjuste(
  precoOriginal: number,
  tipoAjuste: TipoAjustePrecoFornecedor,
  valorAjuste: string,
) {
  const valor = normalizarNumeroDecimal(valorAjuste);

  if (!Number.isFinite(valor)) {
    throw new Error("Valor de ajuste inválido.");
  }

  if (tipoAjuste === "percentual") {
    return precoOriginal * (1 + valor / 100);
  }

  return precoOriginal + valor;
}

function escolherAjuste(
  linha: LinhaPrecoFornecedor,
  ajustes: AjustesPorEscopo,
): {
  ajuste: AjustePrecoImportacaoFornecedor | null;
  origemAjuste: OrigemAjustePrecoFornecedor;
} {
  const ajusteProduto = ajustes.produtos.get(linha.id);
  if (ajusteProduto) {
    return { ajuste: ajusteProduto, origemAjuste: "produto" };
  }

  const categoria = linha.categoriaFornecedor?.trim();
  const ajusteCategoria = categoria ? ajustes.categorias.get(categoria) : null;
  if (ajusteCategoria) {
    return { ajuste: ajusteCategoria, origemAjuste: "categoria" };
  }

  if (ajustes.global) {
    return { ajuste: ajustes.global, origemAjuste: "global" };
  }

  return { ajuste: null, origemAjuste: "nenhum" };
}

export function resolverAjustePrecoFornecedor(
  linha: LinhaPrecoFornecedor,
  ajustes: AjustesPorEscopo,
): ResultadoCalculoAjustePrecoFornecedor {
  const precoBase = linha.precoOriginal ?? linha.precoFornecedor;

  if (!precoBase) {
    return {
      stagingId: linha.id,
      precoOriginal: null,
      precoCalculado: null,
      origemAjuste: "nenhum",
    };
  }

  const precoOriginal = normalizarNumeroDecimal(precoBase);

  if (!Number.isFinite(precoOriginal)) {
    throw new Error("Preço original inválido.");
  }

  const { ajuste, origemAjuste } = escolherAjuste(linha, ajustes);

  if (!ajuste) {
    return {
      stagingId: linha.id,
      precoOriginal: formatarPreco(precoOriginal),
      precoCalculado: null,
      origemAjuste: "nenhum",
    };
  }

  const precoCalculado = aplicarAjuste(
    precoOriginal,
    ajuste.tipoAjuste,
    ajuste.valorAjuste,
  );

  if (precoCalculado < 0) {
    throw new Error("Preço final não pode ser negativo.");
  }

  return {
    stagingId: linha.id,
    precoOriginal: formatarPreco(precoOriginal),
    precoCalculado: formatarPreco(precoCalculado),
    origemAjuste,
  };
}
