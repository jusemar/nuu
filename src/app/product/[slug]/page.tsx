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

import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";
import {
  calcularPrecosProduto,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";
import { resolverUrlCanonicaProduto } from "@/features/products/lib/url-canonica-produto";
import { buscarBreadcrumbCategoriaPorId } from "@/features/store/category/queries/buscar-categoria-publica";
import { ProductDetail } from "@/features/store/products/components/ProductDetailsPage";
import { buscarProdutosRelacionadosPdp } from "@/features/store/products/queries/buscar-produtos-relacionados-pdp";
import { getProductBySlug } from "@/features/store/products/service/productService";
import type {
  Modalidade,
  PrecoModalidade,
} from "@/features/store/products/types/product.types";

// Props que o Next.js injeta automaticamente em pages com [slug]
interface PageProps {
  params: Promise<{ slug: string }>;
}

// `cache` do React memoriza a consulta durante a MESMA requisição.
// Assim `generateMetadata` e o componente da página compartilham o resultado
// em vez de consultar o banco duas vezes.
const buscarProdutoDaPagina = cache(getProductBySlug);

/** Transforma o texto do produto em uma meta description limpa e curta. */
function montarDescricaoParaMetadados(texto: string | null | undefined) {
  const semHtml = (texto ?? "")
    .replace(/<[^>]*>/g, " ") // remove tags caso a descrição venha em HTML
    .replace(/\s+/g, " ")
    .trim();

  if (semHtml === "") return undefined;
  return semHtml.length > 160 ? `${semHtml.slice(0, 157)}...` : semHtml;
}

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

  const titulo = product.metaTitle?.trim() || product.name;
  const descricao =
    montarDescricaoParaMetadados(product.metaDescription) ??
    montarDescricaoParaMetadados(product.description);

  const imagemPrincipal =
    product.galleryImages?.find((imagem) => imagem.isPrimary)?.imageUrl ??
    product.galleryImages?.[0]?.imageUrl;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: urlCanonica },
    openGraph: {
      type: "website",
      url: urlCanonica,
      title: titulo,
      description: descricao,
      images: imagemPrincipal ? [{ url: imagemPrincipal }] : undefined,
    },
  };
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

export default async function ProductPage({ params }: PageProps) {
  // 1. Extrair o slug da URL (ex: "tenis-nike")
  const { slug } = await params;

  // 2. Buscar produto no banco de dados pelo slug
  //    (mesma função memorizada usada em `generateMetadata`)
  const product = await buscarProdutoDaPagina(slug);

  // 3. Se não encontrou, mostra página 404 automática do Next.js
  if (!product) {
    notFound();
  }

  const pricing = normalizarPrecosProduto(product.pricing || []);
  const precosCalculadosPorModalidade = await calcularPrecosProduto(
    pricing.map((preco) => ({
      produtoId: product.id,
      modalidade: preco.type,
      precoBaseEmCentavos: obterPrecoBaseModalidade(preco),
    })),
  );
  const precosCalculadosPorVariante = await calcularPrecosProduto(
    (product.variants || [])
      .filter((variant) => variant.isActive)
      .map((variant) => ({
        produtoId: product.id,
        modalidade: `variant:${variant.id}`,
        precoBaseEmCentavos: variant.priceInCents,
      })),
  );
  const [breadcrumbCategorias, configuracaoLoja, produtosRelacionados] =
    await Promise.all([
      buscarBreadcrumbCategoriaPorId(product.categoryId),
      buscarConfiguracaoLoja(),
      buscarProdutosRelacionadosPdp({
        produtoId: product.id,
        categoriaId: product.categoryId,
        marcaId: product.marcaId,
      }),
    ]);

  // 4. Passa os dados REAIS para o componente client renderizar
  return (
    <ProductDetail
      product={{ ...product, pricing }}
      nomeComercialLoja={configuracaoLoja.nomeComercial}
      breadcrumbCategorias={breadcrumbCategorias}
      precosCalculadosPorModalidade={precosCalculadosPorModalidade}
      precosCalculadosPorVariante={precosCalculadosPorVariante}
      produtosRelacionados={produtosRelacionados}
    />
  );
}
