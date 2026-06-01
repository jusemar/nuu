"use client";

import { Heart, ShoppingCart, Sparkles, Truck, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCarrinho } from "@/features/carrinho";

interface ProductCardProps {
  id: string;
  slug?: string;
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
  slug,
  image,
  title,
  description: _description,
  originalPrice,
  currentPrice,
  discount,
  hasFreeShipping,
  hasFlashSale,
  hasBestPrice,
  isFavorite: externalIsFavorite,
  onToggleFavorite,
  onAddToCart,
  className = "",
  isLoading = false,
}: ProductCardProps) => {
  const router = useRouter();
  const { adicionarItem } = useCarrinho();
  const [internalIsFavorite, setInternalIsFavorite] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isFavorite =
    externalIsFavorite !== undefined ? externalIsFavorite : internalIsFavorite;

  const calculatedDiscount =
    discount ||
    (originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined);

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
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
    } else {
      // O card só adapta dados de UI para o domínio carrinho; a regra fica no hook.
      adicionarItem({
        produtoId: id,
        nome: title,
        variante: "Preço principal",
        prazoModalidade: "Consulte prazo",
        imagemUrl: image,
        precoEmCentavos: Math.round(currentPrice * 100),
        quantidade: 1,
      });
    }

    setTimeout(() => setIsAddingToCart(false), 300);
  };

  const navigateToProduct = () => {
    if (!slug) return;
    router.push(`/product/${slug}`);
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
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-3 rounded bg-gray-200" />
          <div className="h-6 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <article
      className={`group relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${slug ? "cursor-pointer" : ""} ${className}`}
      data-product-id={id}
      itemScope
      itemType="https://schema.org/Product"
      onClick={navigateToProduct}
      onKeyDown={(event) => {
        if (!slug) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigateToProduct();
        }
      }}
      role={slug ? "link" : undefined}
      tabIndex={slug ? 0 : undefined}
    >
      {/* Container da Imagem */}
      <div className="relative aspect-[1/0.75] overflow-hidden bg-gray-50">
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
      <div className="p-3 pt-1">
        {/* Reduzido padding-top */}
        {/* Cabeçalho com Título e Favorito - MAIS COMPACTO */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2 flex-1 text-sm leading-tight font-semibold text-gray-900"
            itemProp="name"
          >
            {title}
          </h3>
          {/* Botão de Favorito - AO LADO DO TÍTULO como estava */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleToggleFavorite();
            }}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:outline-none ${
              isFavorite
                ? "bg-red-50 text-red-500"
                : "text-gray-400 hover:bg-red-50 hover:text-red-500"
            }`}
            aria-label={
              isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
            type="button"
          >
            <Heart
              className={`h-4 w-4 transition-all duration-300 ${
                isFavorite ? "fill-current" : ""
              }`}
            />
          </button>
        </div>

        {/* Seção de Preço */}
        <div className="space-y-2">
          {/* Linha com preço original e desconto */}
          {originalPrice && originalPrice > currentPrice && (
            <div className="flex items-center gap-5">
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </p>
              {calculatedDiscount && calculatedDiscount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                  <Sparkles className="h-2.5 w-2.5" />-{calculatedDiscount}%
                </span>
              )}
            </div>
          )}

          {/* Linha com preço atual, PIX e botão carrinho */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-5">
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
              <span className="rounded-md bg-yellow-300 px-2 py-1 text-[10px] font-bold tracking-wide text-yellow-800 uppercase">
                PIX
              </span>
            </div>

            {/* Botão Carrinho - AZUL */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart();
              }}
              disabled={isAddingToCart}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-300 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${
                isAddingToCart ? "scale-95" : "hover:scale-105 active:scale-95"
              }`}
              aria-label="Adicionar ao carrinho"
              type="button"
            >
              <ShoppingCart
                className={`h-4 w-4 ${isAddingToCart ? "animate-bounce" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Badges - FRETE GRÁTIS e OFERTA RELÂMPAGO na mesma linha */}
        {(hasFreeShipping || hasFlashSale) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasFreeShipping && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-green-800 uppercase">
                <Truck className="h-3 w-3" />
                Frete Grátis
              </span>
            )}

            {hasFlashSale && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-red-800 uppercase">
                <Zap className="h-3 w-3" />
                Promoção
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
