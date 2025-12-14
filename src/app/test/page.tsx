'use client';

import ProductCarousel from '@/features/product-carousel/components/RotatingProductCarousel';
import { ProductCard } from "@/features/product-card/components/ProductCard";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ProductCarousel /> 
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* ProductCard COM TODAS AS PROPS */}
        <ProductCard
          id="prod-001"
          image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
          title="Fones de Ouvido Premium Noise Cancelling"
          description="Cancelamento ativo de ruído, bateria 30h, Bluetooth 5.3, som surround"
          originalPrice={299.99}
          currentPrice={199.99}
          discount={33}
          hasFreeShipping={true}
          hasFlashSale={true}
          hasBestPrice={true}
          isFavorite={false}
          onToggleFavorite={(id) => console.log('Favorito:', id)}
          onAddToCart={(id) => console.log('Carrinho:', id)}
          className="mx-auto"
        />
      </div>
    </div>
  );
}