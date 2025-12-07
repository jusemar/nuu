'use client';
import ProductCard from '@/features/product-card/components/ProductCard';

export default function TestPage() {
  const handleToggleFavorite = (productId: string) => {
    console.log('Toggle favorite:', productId);
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <ProductCard
        id="prod-123"
        image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"
        title="Fone de Ouvido Bluetooth Premium"
        description="Som cristalino com cancelamento de ruído ativo e bateria de 40h"
        originalPrice={699.99}
        currentPrice={488.84}
        discount={30}
        hasFreeShipping={true}
        hasFlashSale={true}
        hasBestPrice={true}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}