import type {
  ProdutoParaItemLogistico,
  VarianteParaItemLogistico,
} from "../resolver-item-logistico";

export type ProdutoAtualComDimensoes = {
  identificadorProduto: string;
  nomeProduto: string;
  codigoSkuProduto?: string | null;
  tipoProdutoAtual?: "simple" | "variable" | null;
  pesoProdutoEmGramas?: number | null;
  alturaProdutoEmCm?: number | null;
  larguraProdutoEmCm?: number | null;
  comprimentoProdutoEmCm?: number | null;
};

export type VarianteAtualComDimensoes = {
  identificadorVariante: string;
  nomeVariante?: string | null;
  codigoSkuVariante?: string | null;
  pesoVarianteEmGramas?: number | null;
  alturaVarianteEmCm?: number | null;
  larguraVarianteEmCm?: number | null;
  comprimentoVarianteEmCm?: number | null;
};

function resolverTipoProdutoAtual(
  tipoProdutoAtual?: "simple" | "variable" | null,
) {
  return tipoProdutoAtual === "variable" ? "com-variantes" : "simples";
}

export function adaptarProdutoAtualParaLogistica(
  produtoAtual: ProdutoAtualComDimensoes,
): ProdutoParaItemLogistico {
  return {
    identificador: produtoAtual.identificadorProduto,
    nome: produtoAtual.nomeProduto,
    codigoSku: produtoAtual.codigoSkuProduto ?? null,
    tipo: resolverTipoProdutoAtual(produtoAtual.tipoProdutoAtual),
    pesoEmGramas: produtoAtual.pesoProdutoEmGramas ?? null,
    alturaEmCm: produtoAtual.alturaProdutoEmCm ?? null,
    larguraEmCm: produtoAtual.larguraProdutoEmCm ?? null,
    comprimentoEmCm: produtoAtual.comprimentoProdutoEmCm ?? null,
  };
}

export function adaptarVarianteAtualParaLogistica(
  varianteAtual: VarianteAtualComDimensoes,
): VarianteParaItemLogistico {
  return {
    identificador: varianteAtual.identificadorVariante,
    nome: varianteAtual.nomeVariante ?? null,
    codigoSku: varianteAtual.codigoSkuVariante ?? null,
    pesoEmGramas: varianteAtual.pesoVarianteEmGramas ?? null,
    alturaEmCm: varianteAtual.alturaVarianteEmCm ?? null,
    larguraEmCm: varianteAtual.larguraVarianteEmCm ?? null,
    comprimentoEmCm: varianteAtual.comprimentoVarianteEmCm ?? null,
  };
}
