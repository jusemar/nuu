'use client';

import ProductCarousel from '@/features/product-carousel/components/RotatingProductCarousel';
import { ProductCard } from "@/features/product-card/components/ProductCard";
import { getProductsByFlag } from '@/features/products/actions/get-products-by-flag';
import { useEffect, useState } from 'react';
import DealsCarousel from '@/features/deals/components/DealsCarousel';

export default function TestPage() {
  const [testProducts, setTestProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Testar a action getProductsByFlag
  useEffect(() => {
    async function testAction() {
      setIsLoading(true);
       try {
    const products = await getProductsByFlag(['general']);
    setTestProducts(products);
    
    // LOG AQUI DENTRO
    console.log('DEBUG mainPrice do primeiro produto:', products[0]?.mainPrice);
    
    console.log('DEBUG todos produtos:', products);
      } catch (error) {
        console.error('Erro ao testar action:', error);
      } finally {
        setIsLoading(false);
      }
    }

    testAction();
  }, []);


  
  return (

    

    <div className="min-h-screen bg-gray-50 p-4">
      {/* PARTE ORIGINAL (mantida) */}
      <ProductCarousel /> 
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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

      {/* SEÇÃO DE TESTE DA ACTION - NOVA */}
      <div className="mt-12 border-t pt-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">🔍 Teste: getProductsByFlag</h2>
        
        {isLoading ? (
          <p className="text-gray-500">Carregando produtos com flag "general"...</p>
        ) : testProducts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">⚠️ Nenhum produto encontrado com flag "general"</p>
            <p className="text-yellow-600 text-sm mt-1">
              Verifique se existem produtos com <code>storeProductFlags</code> contendo "general"
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">✅ {testProducts.length} produto(s) encontrado(s)</p>
            
            <div className="mt-4 space-y-3">
              {testProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="bg-white p-3 rounded border">
              <p><strong>Nome:</strong> {product.name}</p>
              <p><strong>Flags:</strong> {JSON.stringify(product.storeProductFlags)}</p>
              <p><strong>card_short_text:</strong> {product.cardShortText || "(vazio)"}</p>
              
              {/* NOVAS LINHAS PARA PREÇO */}
              <p><strong>Preço principal:</strong> 
                {product.mainPrice ? `R$ ${(product.mainPrice.price / 100).toFixed(2)}` : "(sem preço)"}
              </p>
              
              {product.mainPrice?.hasPromo && product.mainPrice.promoPrice && (
                <p><strong>Preço promocional:</strong> 
                  R$ {(product.mainPrice.promoPrice / 100).toFixed(2)}
                </p>
              )}
              
              <p><strong>Variants:</strong> {product.variants?.length || 0}</p>
              </div>

              ))}
            </div>
            
            {testProducts.length > 3 && (
              <p className="text-sm text-gray-600 mt-2">
                ... e mais {testProducts.length - 3} produtos
              </p>
            )}
          </div>
        )}
      </div>

         <div className="mt-12 border-t pt-8">
    <h2 className="text-2xl font-bold mb-6">🎯 Teste: DealsCarousel (UI)</h2>
    <DealsCarousel />
  </div>

    </div>
  );
}