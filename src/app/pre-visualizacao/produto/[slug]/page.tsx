import { notFound } from "next/navigation";

import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";
import {
  calcularPrecosProduto,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";
import { buscarBreadcrumbCategoriaPorId } from "@/features/store/category/queries/buscar-categoria-publica";
import { ProductDetail } from "@/features/store/products/components/ProductDetailsPage";
import { ProdutosRelacionadosPdp } from "@/features/store/products/components/produtos-relacionados-pdp";
import { buscarProdutosRelacionadosPdp } from "@/features/store/products/queries/buscar-produtos-relacionados-pdp";
import { getProductBySlug } from "@/features/store/products/service/productService";
import type {
  Modalidade,
  PrecoModalidade,
} from "@/features/store/products/types/product.types";

interface PropriedadesPaginaPreVisualizacao {
  params: Promise<{ slug: string }>;
}

function converterDataPromocao(data: Date | string | null | undefined) {
  if (!data) return null;
  const dataConvertida = data instanceof Date ? data : new Date(data);
  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function obterPrecoBaseModalidade(preco: PrecoModalidade) {
  if (!preco.hasPromo || !preco.promoPrice) return preco.price;
  if (preco.promoType !== "flash") return preco.promoPrice;

  const dataFinal = converterDataPromocao(preco.promoEndDate);
  return dataFinal && dataFinal.getTime() > Date.now()
    ? preco.promoPrice
    : preco.price;
}

function normalizarPrecosProduto(
  pricing: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>["pricing"],
): PrecoModalidade[] {
  return pricing.flatMap((preco) => {
    const modalidade = normalizarModalidadePrecoCanonica(preco.type);
    if (!modalidade) return [];

    return [
      {
        type: modalidade as Modalidade,
        price: preco.price,
        mainCardPrice: Boolean(preco.mainCardPrice),
        pricingModalDescription: preco.pricingModalDescription,
        deliveryDays: preco.deliveryDays,
        hasPromo: Boolean(preco.hasPromo),
        promoType:
          preco.promoType === "flash" || preco.promoType === "normal"
            ? preco.promoType
            : null,
        promoPrice: preco.promoPrice,
        promoEndDate: converterDataPromocao(preco.promoEndDate),
        isActive: Boolean(preco.isActive),
      },
    ];
  });
}

export default async function PaginaPreVisualizacaoProduto({
  params,
}: PropriedadesPaginaPreVisualizacao) {
  const { slug } = await params;
  const produto = await getProductBySlug(slug);
  if (!produto) notFound();

  const precos = normalizarPrecosProduto(produto.pricing || []);
  const [
    precosPorModalidade,
    precosPorVariante,
    breadcrumbCategorias,
    configuracaoLoja,
    produtosRelacionados,
  ] = await Promise.all([
    calcularPrecosProduto(
      precos.map((preco) => ({
        produtoId: produto.id,
        modalidade: preco.type,
        precoBaseEmCentavos: obterPrecoBaseModalidade(preco),
      })),
    ),
    calcularPrecosProduto(
      (produto.variants || [])
        .filter((variante) => variante.isActive)
        .map((variante) => ({
          produtoId: produto.id,
          modalidade: `variant:${variante.id}`,
          precoBaseEmCentavos: variante.priceInCents,
        })),
    ),
    buscarBreadcrumbCategoriaPorId(produto.categoryId),
    buscarConfiguracaoLoja(),
    buscarProdutosRelacionadosPdp({
      produtoId: produto.id,
      categoriaId: produto.categoryId,
      marcaId: produto.marcaId,
    }),
  ]);

  return (
    <div data-pdp-preview="true">
      <ProductDetail
        product={{ ...produto, pricing: precos }}
        nomeComercialLoja={configuracaoLoja.nomeComercial}
        breadcrumbCategorias={breadcrumbCategorias}
        precosCalculadosPorModalidade={precosPorModalidade}
        precosCalculadosPorVariante={precosPorVariante}
        modoPreVisualizacao
        conteudoComplementar={
          <ProdutosRelacionadosPdp produtos={produtosRelacionados} />
        }
      />
    </div>
  );
}
