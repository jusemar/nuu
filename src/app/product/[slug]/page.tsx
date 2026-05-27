// src/app/product/[slug]/page.tsx
// ==========================================
// PÁGINA DE DETALHES DO PRODUTO (Server Component)
// ==========================================
// Esta page roda NO SERVIDOR (async).
// Ela busca o produto real no banco de dados pelo slug da URL
// e passa os dados para o componente client (ProductDetail).
//
// Fluxo: URL /product/tenis-nike → slug="tenis-nike" → busca no DB → passa dados

import { notFound } from "next/navigation";
import { getProductBySlug } from "@/features/store/products/service/productService";
import { ProductDetail } from "@/features/store/products/components/ProductDetailsPage";
import { calcularPrecosProduto } from "@/features/precificacao";
import type {
  Modalidade,
  PrecoModalidade,
} from "@/features/store/products/types/product.types";

// Props que o Next.js injeta automaticamente em pages com [slug]
interface PageProps {
  params: Promise<{ slug: string }>;
}

const tiposModalidadeValidos = new Set([
  "stock",
  "pre_sale",
  "preSale",
  "dropshipping",
  "order_basis",
  "orderBasis",
]);

function normalizarTipoModalidade(tipo: string): Modalidade | null {
  if (tipo === "stock") return "stock";
  if (tipo === "pre_sale" || tipo === "preSale") return "pre_sale";
  if (tipo === "dropshipping") return "dropshipping";
  if (tipo === "order_basis" || tipo === "orderBasis") return "order_basis";
  return null;
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
  return pricing
    .filter((preco) => tiposModalidadeValidos.has(preco.type))
    .map((preco) => ({
      type: normalizarTipoModalidade(preco.type) as Modalidade,
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
    }));
}

export default async function ProductPage({ params }: PageProps) {
  // 1. Extrair o slug da URL (ex: "tenis-nike")
  const { slug } = await params;

  // 2. Buscar produto no banco de dados pelo slug
  const product = await getProductBySlug(slug);

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

  // 4. Passa os dados REAIS para o componente client renderizar
  return (
    <ProductDetail
      product={{ ...product, pricing }}
      precosCalculadosPorModalidade={precosCalculadosPorModalidade}
      precosCalculadosPorVariante={precosCalculadosPorVariante}
    />
  );
}
