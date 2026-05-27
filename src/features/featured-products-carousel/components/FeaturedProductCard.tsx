"use client";

import {
  Heart,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCarrinho } from "@/features/carrinho";

interface FeaturedProductCardProps {
  id: string;
  slug?: string;
  image: string;
  title: string;
  description?: string;
  originalPrice?: number;
  currentPrice: number;
  discount?: number;
  hasFreeShipping?: boolean;
  isFeatured?: boolean;
  isExclusive?: boolean;
  isTrending?: boolean;
  badgePromocao?: "normal" | "relampago";
  rating?: number;
  reviewCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const FeaturedProductCard = ({
  id,
  slug,
  image,
  title,
  description,
  originalPrice,
  currentPrice,
  discount,
  hasFreeShipping,
  isFeatured = true,
  isExclusive = false,
  isTrending = false,
  badgePromocao,
  rating = 4.5,
  reviewCount = 42,
  isFavorite: externalIsFavorite,
  onToggleFavorite,
  onAddToCart,
  className = "",
  isLoading = false,
}: FeaturedProductCardProps) => {
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
  const dadosBadgePrincipal = badgePromocao
    ? {
        label: badgePromocao === "relampago" ? "Relâmpago" : "Promoção",
        className:
          badgePromocao === "relampago"
            ? "from-red-600 to-orange-500"
            : "from-emerald-500 to-teal-500",
      }
    : isFeatured
      ? {
          label: "Destaque",
          className: "from-purple-600 to-pink-600",
        }
      : null;

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
        className={`group relative w-full max-w-[296px] animate-pulse overflow-hidden rounded-2xl bg-gray-100 ${className}`}
        role="status"
        aria-label="Carregando produto em destaque"
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
      className={`group relative w-full max-w-[296px] overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${slug ? "cursor-pointer" : ""} ${className}`}
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
      {/* Badge principal no topo */}
      {dadosBadgePrincipal && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${dadosBadgePrincipal.className} px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase shadow-lg`}
          >
            <Sparkles className="h-3 w-3" />
            {dadosBadgePrincipal.label}
          </span>
        </div>
      )}

      {/* Container da Imagem */}
      <div className="relative aspect-[1/0.75] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Badge EXCLUSIVO ou TRENDING na imagem */}
        {isExclusive && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
              <Star className="h-2.5 w-2.5" />
              Exclusivo
            </span>
          </div>
        )}

        {isTrending && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
              <TrendingUp className="h-2.5 w-2.5" />
              Em Alta
            </span>
          </div>
        )}

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

      {/* Conteúdo */}
      <div className="p-3 pt-2">
        {/* Cabeçalho com Título e Favorito */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2 flex-1 text-sm leading-tight font-bold text-gray-900"
            itemProp="name"
          >
            {title}
          </h3>

          {/* Botão de Favorito */}
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleToggleFavorite();
            }}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:outline-none ${
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

        {/* Avaliação - NOVO para produtos em destaque */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">({reviewCount})</span>
        </div>

        {/* Descrição */}
        {description && (
          <p
            className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-600"
            itemProp="description"
          >
            {description}
          </p>
        )}

        {/* Seção de Preço */}
        <div className="space-y-2">
          {/* Linha com preço original e desconto */}
          {originalPrice && originalPrice > currentPrice && (
            <div className="flex items-center gap-5">
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </p>
              {calculatedDiscount && calculatedDiscount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  <Sparkles className="h-2.5 w-2.5" />-{calculatedDiscount}%
                </span>
              )}
            </div>
          )}

          {/* Linha com preço atual, PIX e botão carrinho */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-3">
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

              {/* Badge PIX - com gradiente */}
              <span className="rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-1 text-[10px] font-bold tracking-wide text-yellow-900 uppercase shadow">
                PIX
              </span>
            </div>

            {/* Botão Carrinho - com gradiente roxo */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleAddToCart();
              }}
              disabled={isAddingToCart}
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all duration-300 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:outline-none ${
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

        {/* Badges - FRETE GRÁTIS */}
        {hasFreeShipping && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold tracking-wide text-white uppercase shadow">
              <Truck className="h-3 w-3" />
              Frete Grátis
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

export default FeaturedProductCard;
