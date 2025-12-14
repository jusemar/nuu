'use client';

import ProductCard from '@/features/product-card/components/ProductCard';

export default function TestCardPage() {
  const handleToggleFavorite = (productId: string) => {
    console.log('Toggle favorite:', productId);
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Teste do ProductCard</h1>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 - Com desconto e todos badges */}
        <ProductCard
          id="prod-1"
          image="https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Fones+de+Ouvido"
          title="Fone de Ouvido Bluetooth Premium Noise Cancelling"
          description="Som cristalino com cancelamento de ruído ativo e bateria de 40h de duração. Conforto premium para uso prolongado."
          originalPrice={699.99}
          currentPrice={488.84}
          discount={30}
          hasFreeShipping={true}
          hasFlashSale={true}
          hasBestPrice={true}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />

        {/* Card 2 - Sem desconto, com frete grátis */}
        <ProductCard
          id="prod-2"
          image="https://via.placeholder.com/400x400/10B981/FFFFFF?text=Smartwatch"
          title="Smartwatch Fitness Pro 2025"
          description="Monitor de saúde com GPS, resistência à água e tela AMOLED. Ideal para esportes e dia a dia."
          currentPrice={799.90}
          hasFreeShipping={true}
          hasFlashSale={false}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />

        {/* Card 3 - Apenas preço básico */}
        <ProductCard
          id="prod-3"
          image="https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Camera"
          title="Câmera DSLR Profissional 24MP"
          description="Kit completo para fotografia profissional com lente 18-55mm. Para iniciantes e profissionais."
          originalPrice={2499.90}
          currentPrice={1999.90}
          discount={20}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
        />

        {/* Card 4 - Estado de loading */}
        <ProductCard
          id="prod-4"
          image=""
          title=""
          currentPrice={0}
          isLoading={true}
        />
      </div>

      <div className="mt-12 p-6 bg-white rounded-xl max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Informações do Teste:</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• Clique no ❤️ para testar favoritos (console.log)</li>
          <li>• Clique no 🛒 para testar adicionar ao carrinho (console.log)</li>
          <li>• Cards são responsivos (1 coluna mobile, 2 tablet, 3 desktop)</li>
          <li>• Último card mostra estado de loading</li>
        </ul>
      </div>
    </div>
  );
}