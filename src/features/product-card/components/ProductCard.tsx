'use client';

import { Heart, ShoppingCart, Sparkles, Truck, Zap } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  originalPrice?: number;
  currentPrice: number;
  discount?: number;
  hasFreeShipping?: boolean;
  hasFlashSale?: boolean;
  hasBestPrice?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const ProductCard = ({
  id,
  image,
  title,
  description,
  originalPrice,
  currentPrice,
  discount,
  hasFreeShipping,
  hasFlashSale,
  hasBestPrice,
  isFavorite: externalIsFavorite,
  onToggleFavorite,
  onAddToCart,
  className = '',
  isLoading = false,
}: ProductCardProps) => {
  const [internalIsFavorite, setInternalIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const isFavorite = externalIsFavorite !== undefined ? externalIsFavorite : internalIsFavorite;
  
  const calculatedDiscount = discount || (originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : undefined);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    } else {
      setInternalIsFavorite(!isFavorite);
    }
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    if (onAddToCart) {
      onAddToCart(id);
    }
    
    setTimeout(() => setIsAddingToCart(false), 300);
  };

  if (isLoading) {
    return (
      <div 
        className={`group relative w-full max-w-[280px] animate-pulse overflow-hidden rounded-2xl bg-gray-100 ${className}`}
        role="status"
        aria-label="Carregando produto"
      >
        <div className="aspect-[1/0.85] bg-gray-200" />
        <div className="space-y-3 p-4">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <article 
      className={`group relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      data-product-id={id}
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* Container da Imagem */}
      <div className="relative aspect-[1/0.75] overflow-hidden bg-gray-50">
        {/* Imagem do Produto */}
        <div className="relative h-full w-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority={false}
            itemProp="image"
          />
        </div>
      </div>

      {/* Conteúdo - ESPAÇO REDUZIDO no topo */}
      <div className="p-3 pt-1"> {/* Reduzido padding-top */}
        {/* Cabeçalho com Título e Favorito - MAIS COMPACTO */}
        <div className="flex items-start justify-between gap-2 mb-2"> 
          <h3 
            className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 flex-1"
            itemProp="name"
          >
            {title}
          </h3>
          {/* Botão de Favorito - AO LADO DO TÍTULO como estava */}
          <button
            onClick={handleToggleFavorite}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 ${
              isFavorite 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            type="button"
          >
            <Heart
              className={`h-4 w-4 transition-all duration-300 ${
                isFavorite ? 'fill-current' : ''
              }`}
            />
          </button>
        </div>

        {/* Descrição - MANTIDA */}
        {description && (
          <p 
            className="line-clamp-2 text-xs text-gray-600 leading-relaxed mb-3" /* margin-bottom adicionado */
            itemProp="description"
          >
            {description}
          </p>
        )}

        {/* Seção de Preço */}
        <div className="space-y-2">
          {/* Linha com preço original e desconto */}
          {originalPrice && originalPrice > currentPrice && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </p>
              {calculatedDiscount && calculatedDiscount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  -{calculatedDiscount}%
                </span>
              )}
            </div>
          )}

          {/* Linha com preço atual, PIX e botão carrinho */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <p 
                className="text-xl font-bold tracking-tight text-gray-900"
                itemProp="offers"
                itemScope
                itemType="https://schema.org/Offer"
              >
                <meta itemProp="price" content={currentPrice.toString()} />
                <meta itemProp="priceCurrency" content="BRL" />
                {formatPrice(currentPrice)}
              </p>
              
              {/* Badge PIX - AMARELO */}
              <span className="rounded-md bg-yellow-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                PIX
              </span>
            </div>
            
            {/* Botão Carrinho - AZUL */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                isAddingToCart ? 'scale-95' : 'hover:scale-105 active:scale-95'
              }`}
              aria-label="Adicionar ao carrinho"
              type="button"
            >
              <ShoppingCart className={`h-4 w-4 ${isAddingToCart ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>

        {/* Badges - FRETE GRÁTIS e OFERTA RELÂMPAGO na mesma linha */}
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
    Oferta Relâmpago
  </span>
)}


          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;