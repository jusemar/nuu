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

const modalidadesProduto: Modalidade[] = [
  "stock",
  "pre_sale",
  "dropshipping",
  "order_basis",
];

function normalizarPrecosProduto(
  pricing: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>["pricing"],
): PrecoModalidade[] {
  return pricing
    .filter((preco) => modalidadesProduto.includes(preco.type as Modalidade))
    .map((preco) => ({
      type: preco.type as Modalidade,
      price: preco.price,
      pricingModalDescription: preco.pricingModalDescription,
      deliveryDays: preco.deliveryDays,
      hasPromo: Boolean(preco.hasPromo),
      promoPrice: preco.promoPrice,
      promoEndDate: preco.promoEndDate,
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
      precoBaseEmCentavos:
        preco.hasPromo && preco.promoPrice ? preco.promoPrice : preco.price,
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
