import {
  adaptarPrecosVitrine,
  criarPrecoPrincipalCompatibilidadeVitrine,
  type PrecoPrincipalCompatibilidadeVitrine,
  type PrecoVitrineNormalizado,
  type VarianteVitrineEntrada,
} from "@/features/precificacao";

type PrecoPrincipalProdutoLegado = {
  price: number | null;
  promoPrice?: number | null;
  hasPromo?: boolean | null;
  type?: string | null;
  promoType?: string | null;
  promoEndDate?: Date | string | null;
};

type ProdutoComPrecoVitrine = {
  id: string;
  productKind?: string | null;
  mainPrice: PrecoPrincipalProdutoLegado | null;
  variants?: VarianteVitrineEntrada[] | null;
};

export type ProdutoComPrecoVitrineAplicado<TProduto> = TProduto & {
  mainPrice:
    | PrecoPrincipalCompatibilidadeVitrine
    | PrecoPrincipalProdutoLegado
    | null;
  precoVitrine?: PrecoVitrineNormalizado | null;
};

function criarEntradaPrecoProduto(produto: ProdutoComPrecoVitrine) {
  if (!produto.mainPrice?.price || !produto.mainPrice.type) {
    return [];
  }

  return [
    {
      type: produto.mainPrice.type,
      price: produto.mainPrice.price,
      mainCardPrice: true,
      hasPromo: produto.mainPrice.hasPromo,
      promoPrice: produto.mainPrice.promoPrice,
      promoType: produto.mainPrice.promoType,
      promoEndDate: produto.mainPrice.promoEndDate,
    },
  ];
}

export async function aplicarPrecosVitrineProdutos<
  TProduto extends ProdutoComPrecoVitrine,
>(produtos: TProduto[]): Promise<ProdutoComPrecoVitrineAplicado<TProduto>[]> {
  if (produtos.length === 0) return produtos;

  try {
    const precosVitrine = await adaptarPrecosVitrine(
      produtos.map((produto) => ({
        id: produto.id,
        productKind: produto.productKind,
        pricing: criarEntradaPrecoProduto(produto),
        variants: produto.variants ?? [],
      })),
    );

    return produtos.map((produto) => {
      const precoPrincipal =
        precosVitrine.produtosPorId[produto.id]?.precoPrincipal ?? null;
      const precoCompatibilidade =
        criarPrecoPrincipalCompatibilidadeVitrine(precoPrincipal);

      return {
        ...produto,
        mainPrice: precoCompatibilidade ?? produto.mainPrice,
        precoVitrine: precoPrincipal,
      };
    });
  } catch (error) {
    console.error("Erro ao aplicar precos de vitrine aos produtos", error);
    return produtos;
  }
}
