"use client";

import DealsCarousel from "./DealsCarousel";
import { CartaoOfertaRelampago } from "@/components/common/flash-deal-card";
import type { ProdutoPromocionalHome } from "@/features/deals/queries/buscar-ofertas-home";

interface DealsGridProps {
  produtosOfertaRelampago: ProdutoPromocionalHome[];
  produtosPromocaoNormal: ProdutoPromocionalHome[];
}

export const DealsGrid = ({
  produtosOfertaRelampago,
  produtosPromocaoNormal,
}: DealsGridProps) => {
  const carouselProducts = produtosPromocaoNormal.map((produto) => {
    const precoPromocional = produto.pricing[0];
    const priceNormal = precoPromocional?.price
      ? precoPromocional.price / 100
      : 0;
    const pricePromo = precoPromocional?.promoPrice
      ? precoPromocional.promoPrice / 100
      : null;
    const hasPromo = Boolean(precoPromocional?.hasPromo && pricePromo);
    const discount =
      hasPromo && priceNormal > 0
        ? Math.round(((priceNormal - pricePromo!) / priceNormal) * 100)
        : undefined;

    return {
      id: produto.id,
      slug: produto.slug,
      image: produto.galleryImages[0]?.imageUrl || "/produto-sem-foto.webp",
      title: produto.name,
      description: produto.cardShortText || undefined,
      currentPrice: hasPromo ? pricePromo! : priceNormal,
      originalPrice: hasPromo ? priceNormal : undefined,
      discount,
      hasFreeShipping: produto.hasFreeShipping || false,
      isFeatured: false,
      isExclusive: false,
      isTrending: produto.storeProductFlags?.includes("trending") || false,
      badgePromocao: "normal" as const,
    };
  });

  const temOfertaRelampago = produtosOfertaRelampago.length > 0;
  const classeGrid = temOfertaRelampago
    ? "lg:grid-cols-[minmax(480px,1.02fr)_minmax(0,0.98fr)] xl:grid-cols-[minmax(570px,1.06fr)_minmax(0,0.94fr)]"
    : "lg:grid-cols-1";

  return (
    <div className={`grid grid-cols-1 items-stretch gap-5 ${classeGrid}`}>
      {temOfertaRelampago && (
        <div className="min-w-0">
          <CartaoOfertaRelampago produtos={produtosOfertaRelampago} />
        </div>
      )}

      <div className="min-w-0">
        <DealsCarousel products={carouselProducts} />
      </div>
    </div>
  );
};
