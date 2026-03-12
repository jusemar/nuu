// =====================================================================
// COMPONENTE: CategoryProductCard
// =====================================================================
// Local: src/features/store/category/components/CategoryProductCard.tsx
// 
// FUNÇÃO: Exibir produto na página de categoria (PLP)
// - Usa imagem da galeria (product_gallery_images)
// - Fallback para imagem da primeira variante se necessário
// =====================================================================

'use client';

import { Heart, ShoppingCart, Sparkles, Truck, Zap } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// =====================================================================
// TIPO: CategoryProductCardProps
// =====================================================================
interface CategoryProductCardProps {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  price: number;
  originalPrice?: number | null;
  hasFreeShipping?: boolean;
  hasFlashSale?: boolean;
  hasBestPrice?: boolean;
  className?: string;
  isLoading?: boolean;
}

export function CategoryProductCard({
  id,
  name,
  slug,
  imageUrl,
  price,
  originalPrice,
  hasFreeShipping,
  hasFlashSale,
  hasBestPrice,
  className = '',
  isLoading = false,
}: CategoryProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // =================================================================
  // Calcula desconto se houver preço original
  // =================================================================
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : undefined;

  // =================================================================
  // Formata preço para Real brasileiro
  // =================================================================
  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  // =================================================================
  // Handlers
  // =================================================================
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implementar lógica de favoritos
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    // TODO: Implementar lógica de adicionar ao carrinho
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  // =================================================================
  // Loading state (esqueleto)
  // =================================================================
  if (isLoading) {
    return (
      <div 
        className="group relative w-full max-w-[280px] animate-pulse overflow-hidden rounded-2xl bg-gray-100"
        role="status"
        aria-label="Carregando produto"
      >
        <div className="aspect-[1/0.85] bg-gray-200" />
        <div className="space-y-3 p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <article 
      className={`group relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      data-product-id={id}
    >
      {/* Link para página do produto */}
      <Link href={`/product/${slug}`} className="block">
        
        {/* Container da Imagem */}
        <div className="relative aspect-[1/0.75] overflow-hidden bg-gray-50">
          {imageUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
          ) : (
            // Placeholder quando não há imagem
            <div className="flex h-full items-center justify-center bg-gray-100">
              <span className="text-sm text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-3 pt-1">
        {/* Cabeçalho com Título e Favorito */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/product/${slug}`} className="flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 hover:text-blue-600 transition-colors">
              {name}
            </h3>
          </Link>
          
          {/* Botão de Favorito */}
          <button
            onClick={handleToggleFavorite}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 ${
              isFavorite 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Seção de Preço - IGUAL AO ORIGINAL */}
        <div className="space-y-2">
          {/* Linha com preço original e desconto */}
          {originalPrice && originalPrice > price && (
            <div className="flex items-center gap-5">
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </p>
              {discount && discount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  -{discount}%
                </span>
              )}
            </div>
          )}

          {/* Linha com preço atual, PIX e botão carrinho */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-5">
              <p className="text-xl font-bold tracking-tight text-gray-900">
                {formatPrice(price)}
              </p>
              
              {/* Badge PIX - ADICIONADO IGUAL AO ORIGINAL */}
              <span className="rounded-md bg-yellow-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                PIX
              </span>
            </div>
            
            {/* Botão Carrinho */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-300 hover:bg-blue-700 ${
                isAddingToCart ? 'scale-95' : 'hover:scale-105'
              }`}
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart className={`h-4 w-4 ${isAddingToCart ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>

        {/* Badges */}
        {(hasFreeShipping || hasFlashSale) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hasFreeShipping && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                <Truck className="h-3 w-3" />
                Frete Grátis
              </span>
            )}
            
            {hasFlashSale && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                <Zap className="h-3 w-3" />
                Promoção
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}