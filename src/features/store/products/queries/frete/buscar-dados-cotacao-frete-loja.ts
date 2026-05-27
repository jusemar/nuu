import "server-only";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import type {
  ProdutoAtualComDimensoes,
  RetiradaAtualDisponivel,
  VarianteAtualComDimensoes,
} from "@/features/logistica";
import { eq } from "drizzle-orm";
import { selecionarVarianteCotacaoLoja } from "../../lib/frete/selecionar-variante-cotacao-loja";

export type DadosCotacaoFreteLoja = {
  categoriaId: string;
  produtoAtual: ProdutoAtualComDimensoes;
  varianteAtual: VarianteAtualComDimensoes | null;
  retiradasAtuais: RetiradaAtualDisponivel[];
  valorDeclaradoEmCentavos: number | null;
};

function montarRetiradasAtuais(produto: {
  allowsPickup: boolean | null;
  prazoRetiradaCustom: string | null;
  modeloRetirada?: {
    id: string;
    nome: string;
    prazoTexto: string;
    mensagem: string | null;
    ativo: boolean | null;
  } | null;
}): RetiradaAtualDisponivel[] {
  if (!produto.allowsPickup || !produto.modeloRetirada?.ativo) {
    return [];
  }

  return [
    {
      identificador: produto.modeloRetirada.id,
      nome: produto.modeloRetirada.nome,
      descricao:
        produto.prazoRetiradaCustom ||
        produto.modeloRetirada.prazoTexto ||
        produto.modeloRetirada.mensagem,
    },
  ];
}

function obterValorDeclaradoProdutoLoja(
  produto: {
    pricing: Array<{
      isActive: boolean | null;
      mainCardPrice: boolean | null;
      hasPromo: boolean | null;
      promoPrice: number | null;
      price: number;
    }>;
    variants: Array<{
      id: string;
      priceInCents: number;
    }>;
  },
  varianteId?: string | null,
) {
  const variante = varianteId
    ? produto.variants.find((varianteAtual) => varianteAtual.id === varianteId)
    : null;

  if (variante) {
    return variante.priceInCents;
  }

  const precoProduto =
    produto.pricing.find((preco) => preco.isActive && preco.mainCardPrice) ??
    produto.pricing.find((preco) => preco.isActive);

  if (!precoProduto) {
    return null;
  }

  return precoProduto.hasPromo && precoProduto.promoPrice
    ? precoProduto.promoPrice
    : precoProduto.price;
}

export async function buscarDadosCotacaoFreteLoja(
  produtoId: string,
  varianteId?: string | null,
): Promise<DadosCotacaoFreteLoja | null> {
  const produto = await db.query.productTable.findFirst({
    where: eq(productTable.id, produtoId),
    with: {
      variants: true,
      modeloRetirada: true,
      pricing: true,
    },
  });

  if (!produto) {
    return null;
  }

  return {
    categoriaId: produto.categoryId,
    produtoAtual: {
      identificadorProduto: produto.id,
      nomeProduto: produto.name,
      codigoSkuProduto: produto.sku,
      tipoProdutoAtual:
        produto.productKind === "variable" ? "variable" : "simple",
      pesoProdutoEmGramas: produto.weight,
      alturaProdutoEmCm: produto.height,
      larguraProdutoEmCm: produto.width,
      comprimentoProdutoEmCm: produto.length,
    },
    varianteAtual: selecionarVarianteCotacaoLoja(produto.variants, varianteId),
    retiradasAtuais: montarRetiradasAtuais(produto),
    valorDeclaradoEmCentavos: obterValorDeclaradoProdutoLoja(
      produto,
      varianteId,
    ),
  };
}
