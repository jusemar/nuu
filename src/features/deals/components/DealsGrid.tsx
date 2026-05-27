"use client";

import { useProductsByFlag } from "@/features/products/api/queries/use-products-by-flag";
import DealsCarousel from "./DealsCarousel";
import { CartaoOfertaRelampago } from "@/components/common/flash-deal-card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealsGridProps {
  produtosOfertaRelampago: any[]; // Produtos com galleryImages e pricing
  dataFinalOfertaRelampago: string;
}

export const DealsGrid = ({
  produtosOfertaRelampago,
  dataFinalOfertaRelampago,
}: DealsGridProps) => {
  // Usando TanStack Query com cache
  const {
    data: saleProducts = [],
    isLoading,
    error,
  } = useProductsByFlag(["new"]);

  if (error) {
    return (
      <div className="mb-8 px-4 text-red-600">
        Erro ao carregar ofertas: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-6 px-4 lg:grid-cols-[minmax(480px,1.02fr)_minmax(0,0.98fr)]">
        <div>
          <Skeleton className="h-[490px] rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-[490px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Converter produtos
  const carouselProducts = saleProducts.map((p) => {
    const priceNormal = p.mainPrice?.price ? p.mainPrice.price / 100 : 0;
    const pricePromo = p.mainPrice?.promoPrice
      ? p.mainPrice.promoPrice / 100
      : null;
    const hasPromo = p.mainPrice?.hasPromo && pricePromo;
    const discount =
      hasPromo && priceNormal > 0
        ? Math.round(((priceNormal - pricePromo) / priceNormal) * 100)
        : undefined;

    return {
      id: p.id,
      slug: p.slug,
      image: p.mainImage?.imageUrl || "/produto-sem-foto.webp",
      title: p.name,
      description: p.cardShortText || undefined,
      currentPrice: hasPromo ? pricePromo! : priceNormal,
      originalPrice: hasPromo ? priceNormal : undefined,
      discount: discount,
      hasFreeShipping: p.hasFreeShipping || false,
      // O card compartilhado com "Os mais queridos" usa flags de destaque.
      isFeatured: Boolean(hasPromo),
      isExclusive: false,
      isTrending: p.storeProductFlags?.includes("trending") || false,
    };
  });

  return (
    <div className="mb-8 grid grid-cols-1 items-stretch gap-6 px-4 lg:grid-cols-[minmax(480px,1.02fr)_minmax(0,0.98fr)] xl:grid-cols-[minmax(570px,1.06fr)_minmax(0,0.94fr)]">
      <div className="min-w-0">
        <CartaoOfertaRelampago
          produtos={produtosOfertaRelampago}
          dataFinal={dataFinalOfertaRelampago}
        />
      </div>

      <div className="min-w-0">
        <DealsCarousel products={carouselProducts} />
      </div>
    </div>
  );
};
