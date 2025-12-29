import { getProductsByFlag } from '@/features/products/actions/get-products-by-flag';
import DealsCarousel from './DealsCarousel';
import { FlashDealCard } from "@/components/common/flash-deal-card";
import { productTable, productVariantTable } from '@/db/schema'; // Importe tipos se precisar

interface DealsGridProps {
  flashDealProduct: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  };
  flashDealEndDate: string;
}

export const DealsGrid = async ({ 
  flashDealProduct, 
  flashDealEndDate 
}: DealsGridProps) => {
  // Buscar produtos com flag 'sale'
  const saleProducts = await getProductsByFlag(['new']);

  // Converter produtos para formato do DealsCarousel
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
  hasFlashSale: Boolean(hasPromo), // Garante boolean
  hasBestPrice: false,
};

  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 mb-8">
      {/* Card de Oferta Relâmpago */}
      <div className="lg:col-span-1">
        <FlashDealCard 
          product={flashDealProduct} 
          endDate={flashDealEndDate}
        />
      </div>
      
      {/* Carousel de Ofertas */}
      <div className="lg:col-span-3">
        <DealsCarousel 
          products={carouselProducts}
          title="🔥 Ofertas Especiais"
        />
      </div>
    </div>
  );
};