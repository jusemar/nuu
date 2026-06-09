"use client";

import { Heart, ShoppingCart, Star, TrendingUp, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCarrinho } from "@/features/carrinho";
import {
  BadgePromocional,
  type TipoBadgePromocionalVisual,
} from "@/features/promocoes/components/store/badge-promocional";

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
  badgePromocao?: TipoBadgePromocionalVisual | null;
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
  description: _description,
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

  const calculatedDiscount = discount;
  const dadosBadgePrincipal =
    !badgePromocao && isFeatured
      ? {
          label: "Destaque",
          className: "bg-primary text-primary-foreground",
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
        className={`group bg-muted relative w-full max-w-[296px] animate-pulse overflow-hidden rounded-xl ${className}`}
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
      className={`group border-border/80 bg-card hover:border-primary/20 hover:shadow-elevation relative w-full max-w-[296px] overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-1 ${slug ? "cursor-pointer" : ""} ${className}`}
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
      {badgePromocao ? (
        <div className="absolute top-3 left-3 z-10">
          <BadgePromocional
            tipo={badgePromocao}
            percentualOff={calculatedDiscount}
          />
        </div>
      ) : dadosBadgePrincipal ? (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm ${dadosBadgePrincipal.className}`}
          >
            {dadosBadgePrincipal.label}
          </span>
        </div>
      ) : null}

      {/* Container da Imagem */}
      <div className="bg-muted/60 relative aspect-[1/0.75] overflow-hidden">
        {/* Badge EXCLUSIVO ou TRENDING na imagem */}
        {isExclusive && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-accent-brand inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
              <Star className="h-2.5 w-2.5" />
              Exclusivo
            </span>
          </div>
        )}

        {isTrending && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
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
      <div className="p-3 pt-2.5">
        {/* Cabeçalho com Título e Favorito */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            className="text-foreground line-clamp-2 flex-1 text-sm leading-tight font-semibold"
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
            className={`focus:ring-primary flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
              isFavorite
                ? "bg-red-50 text-red-500"
                : "text-muted-foreground hover:bg-red-50 hover:text-red-500"
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
                    ? "fill-accent-brand text-accent-brand"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-foreground text-xs font-medium">
            {rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground text-xs">({reviewCount})</span>
        </div>

        {/* Seção de Preço */}
        <div className="space-y-2">
          {/* Linha com preço original e desconto */}
          {originalPrice && originalPrice > currentPrice && (
            <div className="flex items-center gap-5">
              <p className="text-muted-foreground text-xs line-through">
                {formatPrice(originalPrice)}
              </p>
              {calculatedDiscount && calculatedDiscount > 0 && (
                <BadgePromocional
                  tipo={badgePromocao ?? "promocao"}
                  percentualOff={calculatedDiscount}
                />
              )}
            </div>
          )}

          {/* Linha com preço atual, PIX e botão carrinho */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-3">
              <p
                className="text-foreground text-lg font-bold tracking-tight sm:text-xl"
                itemProp="offers"
                itemScope
                itemType="https://schema.org/Offer"
              >
                <meta itemProp="price" content={currentPrice.toString()} />
                <meta itemProp="priceCurrency" content="BRL" />
                {formatPrice(currentPrice)}
              </p>

              {/* Badge PIX - com gradiente */}
              <span className="bg-accent-brand-light text-accent-dark rounded-md px-2 py-1 text-[10px] font-bold tracking-wide uppercase">
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
              className={`bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                isAddingToCart ? "scale-95" : "active:scale-95"
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
            <span className="bg-success-light text-success-dark inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
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
