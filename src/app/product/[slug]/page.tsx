// src/app/product/[slug]/page.tsx
// ==========================================
// PÁGINA DE DETALHES DO PRODUTO (Server Component)
// ==========================================
// Esta page roda NO SERVIDOR (async).
// Ela busca o produto real no banco de dados pelo slug da URL
// e passa os dados para o componente client (ProductDetail).
//
// Fluxo: URL /product/tenis-nike → slug="tenis-nike" → busca no DB → passa dados

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Footer } from "@/components/common/footer";
import { BannerInstitucionalProduto } from "@/features/banners-home/components/store/banner-institucional-produto";
import { buscarBannerHomeAtivoPorPosicao } from "@/features/banners-home/queries/buscar-banners-home-ativos";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";
import { avaliarSeloPagamentoNaEntregaPdp } from "@/features/pagamento-na-entrega/queries/avaliar-pagamento-na-entrega-pdp";
import {
  calcularPrecosProduto,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";
import { resolverUrlCanonicaProduto } from "@/features/products/lib/url-canonica-produto";
import { resolverVarianteInicialUrl } from "@/features/products/lib/url-variante-produto";
import { buscarBreadcrumbCategoriaPorId } from "@/features/store/category/queries/buscar-categoria-publica";
import { DadosEstruturadosProduto } from "@/features/store/products/components/dados-estruturados-produto";
import { ProductDetail } from "@/features/store/products/components/ProductDetailsPage";
import { montarMetadataProduto } from "@/features/store/products/lib/metadata-produto";
import { buscarProdutosRelacionadosPdp } from "@/features/store/products/queries/buscar-produtos-relacionados-pdp";
import { buscarVendaCruzadaPdp } from "@/features/store/products/queries/venda-cruzada/buscar-venda-cruzada-pdp";
import { getProductBySlug } from "@/features/store/products/service/productService";
import type {
  Modalidade,
  PrecoModalidade,
} from "@/features/store/products/types/product.types";

// Props que o Next.js injeta automaticamente em pages com [slug]
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// `cache` do React memoriza a consulta durante a MESMA requisição.
// Assim `generateMetadata` e o componente da página compartilham o resultado
// em vez de consultar o banco duas vezes.
const buscarProdutoDaPagina = cache(getProductBySlug);

// ==========================================
// METADADOS (SEO) — roda no servidor
// ==========================================
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await buscarProdutoDaPagina(slug);

  // Produto inexistente/despublicado: a própria página devolve 404.
  if (!product) return {};

  // A URL canônica sai sempre da configuração única do projeto.
  // Se o gestor personalizou o campo na aba SEO, a personalização é respeitada.
  const urlCanonica = resolverUrlCanonicaProduto({
    slug: product.slug,
    urlCanonicaSalva: product.canonicalUrl,
  });

  return montarMetadataProduto({ produto: product, urlCanonica });
}

function converterDataPromocao(data: Date | string | null | undefined) {
  if (!data) return null;
  const dataConvertida = data instanceof Date ? data : new Date(data);
  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function obterPrecoBaseModalidade(preco: PrecoModalidade) {
  if (!preco.hasPromo || !preco.promoPrice) return preco.price;

  const isRelampago = preco.promoType === "flash";
  if (!isRelampago) return preco.promoPrice;

  const dataFinal = converterDataPromocao(preco.promoEndDate);
  const relampagoAtivo = Boolean(dataFinal && dataFinal.getTime() > Date.now());

  return relampagoAtivo ? preco.promoPrice : preco.price;
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

export default async function ProductPage({ params, searchParams }: PageProps) {
  // 1. Extrair o slug da URL (ex: "tenis-nike")
  const { slug } = await params;
  const parametrosBusca = await searchParams;

  // 2. Buscar produto no banco de dados pelo slug
  //    (mesma função memorizada usada em `generateMetadata`)
  const product = await buscarProdutoDaPagina(slug);

  // 3. Se não encontrou, mostra página 404 automática do Next.js
  if (!product) {
    notFound();
  }

  const parametroVariante =
    typeof parametrosBusca.variant === "string"
      ? parametrosBusca.variant
      : undefined;
  const varianteInicial = resolverVarianteInicialUrl({
    tipoProduto: product.productKind,
    variantes: product.variants,
    varianteId: parametroVariante,
  });

  const urlCanonica = resolverUrlCanonicaProduto({
    slug: product.slug,
    urlCanonicaSalva: product.canonicalUrl,
  });

  const pricing = normalizarPrecosProduto(product.pricing || []);
  const entradasPrecosModalidades = pricing.map((preco) => ({
    produtoId: product.id,
    modalidade: preco.type,
    precoBaseEmCentavos: obterPrecoBaseModalidade(preco),
  }));
  const entradasPrecosVariantes = (product.variants || [])
    .filter((variant) => variant.isActive)
    .map((variant) => ({
      produtoId: product.id,
      modalidade: `variant:${variant.id}`,
      precoBaseEmCentavos: variant.priceInCents,
    }));
  // Configuração de pagamento e promoções são comuns às duas coleções. Uma única
  // precificação evita repetir essas leituras durante a abertura da PDP.
  const todosPrecosCalculados = await calcularPrecosProduto([
    ...entradasPrecosModalidades,
    ...entradasPrecosVariantes,
  ]);
  const precosCalculadosPorModalidade = Object.fromEntries(
    entradasPrecosModalidades.flatMap((entrada) => {
      const preco = todosPrecosCalculados[entrada.modalidade];
      return preco ? [[entrada.modalidade, preco]] : [];
    }),
  );
  const precosCalculadosPorVariante = Object.fromEntries(
    entradasPrecosVariantes.flatMap((entrada) => {
      const preco = todosPrecosCalculados[entrada.modalidade];
      return preco ? [[entrada.modalidade, preco]] : [];
    }),
  );
  const [
    breadcrumbCategorias,
    configuracaoLoja,
    produtosRelacionados,
    bannerInstitucionalProduto,
    produtosVendaCruzada,
  ] = await Promise.all([
    buscarBreadcrumbCategoriaPorId(product.categoryId),
    buscarConfiguracaoLoja(),
    buscarProdutosRelacionadosPdp({
      produtoId: product.id,
      categoriaId: product.categoryId,
      marcaId: product.marcaId,
    }),
    buscarBannerHomeAtivoPorPosicao("produto_institucional"),
    buscarVendaCruzadaPdp(product.id),
  ]);

  // O motor do selo faz várias leituras próprias. Executá-lo dentro do Promise.all acima
  // multiplicava o pico de consultas HTTP durante uma navegação RSC e podia derrubar a
  // página inteira com ECONNRESET. A avaliação continua autoritativa, apenas fora da
  // rajada das consultas estruturais da PDP.
  const selo = await avaliarSeloPagamentoNaEntregaPdp({
    produtoId: product.id,
    // Sem variante: a PDP abre na visão do produto, e a variante escolhida é estado do
    // cliente. `null` faz o motor herdar a decisão do produto, que é o comportamento
    // correto para uma informação genérica da página.
    varianteId: null,
    modalidadeComercial: pricing[0]?.type ?? null,
    permiteEntregaPropria: Boolean(product.allowsOwnDelivery),
  });

  // Identificadores e procedência servem ao JSON-LD no servidor e não devem
  // aumentar nem expor o payload enviado ao componente interativo da PDP.
  const {
    identificadoresCatalogo: identificadoresProduto,
    variants: variantesComIdentificadores,
    ...produtoSemIdentificadores
  } = product;
  void identificadoresProduto;
  const variantesSemIdentificadores = variantesComIdentificadores.map(
    ({ identificadoresCatalogo, ...variant }) => {
      void identificadoresCatalogo;
      return variant;
    },
  );

  // 4. Passa os dados REAIS para o componente client renderizar
  return (
    <>
      <DadosEstruturadosProduto
        produto={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          brand: product.brand,
          sku: product.sku,
          productKind: product.productKind,
          marcaId: product.marcaId,
          identificadoresCatalogo: product.identificadoresCatalogo,
          galleryImages: product.galleryImages,
          pricing,
          variants: product.variants,
        }}
        urlCanonica={urlCanonica}
        nomeVendedor={configuracaoLoja.nomeComercial}
        breadcrumbCategorias={breadcrumbCategorias}
        precosCalculadosPorModalidade={precosCalculadosPorModalidade}
        precosCalculadosPorVariante={precosCalculadosPorVariante}
      />
      <ProductDetail
        rodape={<Footer />}
        urlCompartilhamento={urlCanonica}
        initialVariantId={varianteInicial?.id ?? null}
        product={{
          ...produtoSemIdentificadores,
          variants: variantesSemIdentificadores,
          pricing,
        }}
        nomeComercialLoja={configuracaoLoja.nomeComercial}
        breadcrumbCategorias={breadcrumbCategorias}
        precosCalculadosPorModalidade={precosCalculadosPorModalidade}
        precosCalculadosPorVariante={precosCalculadosPorVariante}
        produtosRelacionados={produtosRelacionados}
        produtosVendaCruzada={produtosVendaCruzada}
        servicosComPagamentoNaEntrega={selo.servicosComPagamentoNaEntrega}
        bannerInstitucionalProduto={
          bannerInstitucionalProduto ? (
            <BannerInstitucionalProduto banner={bannerInstitucionalProduto} />
          ) : null
        }
      />
    </>
  );
}
