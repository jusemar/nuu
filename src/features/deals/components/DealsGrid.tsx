'use client';

import { useProductsByFlag } from '@/features/products/api/queries/use-products-by-flag';
import DealsCarousel from './DealsCarousel';
import { FlashDealCard } from '@/components/common/flash-deal-card';
import { productTable, productVariantTable } from '@/db/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface DealsGridProps {
  flashDealProduct: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  };
  flashDealEndDate: string;
}

export const DealsGrid = ({ 
  flashDealProduct, 
  flashDealEndDate 
}: DealsGridProps) => {
  // Usando TanStack Query com cache
  const { data: saleProducts = [], isLoading, error } = useProductsByFlag(['new']);

  if (error) {
    return (
      <div className="px-4 mb-8 text-red-600">
        Erro ao carregar ofertas: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 mb-8">
        <div className="lg:col-span-1">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Converter produtos
  const carouselProducts = saleProducts.map(p => {
    const priceNormal = p.mainPrice?.price ? p.mainPrice.price / 100 : 0;
    const pricePromo = p.mainPrice?.promoPrice ? p.mainPrice.promoPrice / 100 : null;
    const hasPromo = p.mainPrice?.hasPromo && pricePromo;
    const discount = hasPromo && priceNormal > 0 
      ? Math.round(((priceNormal - pricePromo) / priceNormal) * 100)
      : undefined;

    return {
      id: p.id,
      image: p.mainImage?.imageUrl || '/produto-sem-foto.webp',
      title: p.name,
      description: p.cardShortText || undefined,
      currentPrice: hasPromo ? pricePromo! : priceNormal,
      originalPrice: hasPromo ? priceNormal : undefined,
      discount: discount,
      hasFreeShipping: p.hasFreeShipping || false,
      hasFlashSale: Boolean(hasPromo),
      hasBestPrice: false,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 mb-8">
      <div className="lg:col-span-1">
        <FlashDealCard 
          product={flashDealProduct} 
          endDate={flashDealEndDate}
        />
      </div>
      
      <div className="lg:col-span-3">
        <DealsCarousel 
          products={carouselProducts}
          title="🔥 Ofertas Especiais"
        />
      </div>
    </div>
  );
};