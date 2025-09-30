// src/components/common/deals-grid.tsx
import { productTable, productVariantTable } from "@/db/schema";
import ProductCarousel from "./product-carousel";
import { FlashDealCard } from "./flash-deal-card";

interface DealsGridProps {
  flashDealProduct: (typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  });
  products: (typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  })[];
  flashDealEndDate: string; // ← NOVA PROP
}

export const DealsGrid = ({ flashDealProduct, products, flashDealEndDate }: DealsGridProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 mb-8">
      {/* Card de Oferta Relâmpago com produto específico */}
      <div className="lg:col-span-1">
        <FlashDealCard 
          product={flashDealProduct} 
          endDate={flashDealEndDate} // ← PASSA A DATA
        />
      </div>
      
      {/* Carousel de Ofertas */}
      <div className="lg:col-span-3">
        <ProductCarousel products={products} title="🔥 Ofertas Especiais" />
      </div>
    </div>
  );
};