// src/features/product-grid-with-load-more/components/ProductGridWithLoadMore.tsx
"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FeaturedProductCard } from "@/features/featured-products-carousel/components/FeaturedProductCard";
import type { TipoBadgePromocionalVisual } from "@/features/promocoes";

import { useProductsInfinite } from "../hooks/useInfiniteProducts";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

interface ProdutoDescoberta {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cardShortText: string | null;
  hasFreeShipping: boolean | null;
  storeProductFlags: string[] | null;
  mainImage: { imageUrl: string } | null;
  mainPrice: {
    price: number;
    promoPrice?: number | null;
    percentualOff?: number | null;
    badgePromocional?: string | null;
  } | null;
}

/**
 * Função que transforma os dados do banco para o formato que o FeaturedProductCard espera
 * O banco retorna dados em um formato, mas o componente de card precisa de outro formato
 */
function formatProductForCard(product: ProdutoDescoberta) {
  // 💰 CONVERSÃO DE PREÇOS: Banco armazena em centavos
  const originalPriceInCents = product.mainPrice?.price;
  const promoPriceInCents = product.mainPrice?.promoPrice;
  const percentualOff = product.mainPrice?.percentualOff;

  const originalPrice = originalPriceInCents
    ? originalPriceInCents / 100
    : undefined;

  const promoPrice = promoPriceInCents ? promoPriceInCents / 100 : undefined;

  const currentPrice = promoPrice || originalPrice || 0;

  const discount =
    typeof percentualOff === "number" && percentualOff > 0
      ? percentualOff
      : undefined;

  // 🖼️ IMAGEM: Usa a imagem principal do produto ou um placeholder genérico
  let imageUrl = "/produto-sem-foto.webp"; // Coloque uma imagem placeholder na pasta public

  if (product.mainImage?.imageUrl) {
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";
    imageUrl = `${baseUrl}${product.mainImage.imageUrl}`;
  }

  return {
    id: product.id,
    slug: product.slug,
    image: imageUrl,
    title: product.name,
    description: product.cardShortText || product.description || "",
    originalPrice,
    currentPrice,
    discount,
    badgePromocao: normalizarBadgePromocional(
      product.mainPrice?.badgePromocional,
    ),
    hasFreeShipping: product.hasFreeShipping || false,
    isFeatured: product.storeProductFlags?.includes("featured") || false,
    isExclusive: product.storeProductFlags?.includes("exclusive") || false,
    isTrending: product.storeProductFlags?.includes("trending") || false,
    rating: undefined,
    reviewCount: undefined,
  };
}

function normalizarBadgePromocional(
  valor: string | null | undefined,
): TipoBadgePromocionalVisual | undefined {
  return valor === "promocao" || valor === "relampago" ? valor : undefined;
}

export function ProductGridWithLoadMore() {
  // 🎯 USANDO NOSSO HOOK: Ele gerencia o carregamento dos produtos
  const {
    data, // Dados carregados
    isLoading, // Primeiro carregamento
    isFetchingNextPage, // Carregando mais produtos
    fetchNextPage, // Função para carregar mais
    hasNextPage, // Tem mais produtos para carregar?
    configurando,
  } = useProductsInfinite();

  // 📦 JUNTANDO TODOS OS PRODUTOS:
  // O hook retorna páginas separadas, mas nós queremos uma lista única
  const allProducts = Array.from(
    new Map(
      (data?.pages.flatMap((page) => page.products) || []).map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  );

  // 🔄 ATUALIZAR URL QUANDO CARREGA MAIS:
  // Quando o usuário clica "Ver mais", a URL muda para ?page=2, ?page=3, etc.
  // Isso é importante para SEO e para compartilhar links
  useEffect(() => {
    if (data?.pages.length && data.pages.length > 1) {
      const currentPage = data.pages.length;
      const url = new URL(window.location.href);
      url.searchParams.set("page", currentPage.toString());

      // Atualiza a URL sem recarregar a página
      window.history.pushState({}, "", url.toString());
    }
  }, [data?.pages.length]);

  // 📱 CLASSES DO GRID RESPONSIVO:
  // - Mobile: 2 colunas
  // - Tablet: 3 colunas
  // - Laptop: 4 colunas
  // - Desktop grande: 5 colunas para preservar a largura do card padrao
  const gridClasses =
    "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  // 🌀 PRIMEIRO CARREGAMENTO: Mostra esqueletos enquanto busca dados
  if ((configurando || isLoading) && allProducts.length === 0) {
    return <ProductGridSkeleton />;
  }

  // ⚠️ SEM PRODUTOS: Se não encontrar nenhum produto
  if (allProducts.length === 0) {
    return (
      <div className="border-border bg-card rounded-xl border py-12 text-center">
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* 🔲 GRID DE PRODUTOS */}
      <div className={gridClasses}>
        {allProducts.map((product) => (
          // 🎨 CADA CARD DE PRODUTO:
          // Usamos o MESMO componente do carousel 3D para consistência visual
          <FeaturedProductCard
            key={product.id} // 🔑 Chave única para React
            {...formatProductForCard(product)} // 🛠️ Transforma dados
          />
        ))}
      </div>

      {/* 🔘 BOTÃO "VER MAIS PRODUTOS" */}
      {hasNextPage && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => fetchNextPage()} // 📥 Carrega mais produtos
            disabled={isFetchingNextPage} // 🚫 Desabilita enquanto carrega
            className="px-8"
          >
            <span className="flex items-center justify-center gap-2">
              {isFetchingNextPage && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              Ver mais
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
