// src/features/product-card/components/ProductCard.tsx
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: number;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  flashSale?: boolean;
  freeShipping?: boolean;
  bestPriceBrazil?: boolean;
  pixHighlight?: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const lowestPrice = product.discountPrice || product.price;
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - lowestPrice) / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 w-64 mx-auto">
      {/* Badge de desconto no topo esquerdo */}
      {discountPercent > 0 && (
        <Badge className="absolute top-3 left-3 z-20 bg-red-600 text-white font-bold text-xs py-1 px-2">
          -{discountPercent}%
        </Badge>
      )}

      {/* Badge Menor Preço BR – canto inferior esquerdo da imagem */}
      {product.bestPriceBrazil && (
        <Badge className="absolute bottom-3 left-3 z-20 bg-purple-600 text-white text-[10px] font-bold py-1 px-2">
          MENOR PREÇO BR
        </Badge>
      )}

      {/* Favorito */}
      <button className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white shadow-md">
        <Heart className="w-4 h-4" />
      </button>

      {/* Imagem */}
      <div className="aspect-square relative bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="256px"
          className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-sm font-medium line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Linha do preço + PIX + botão carrinho */}
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            {discountPercent > 0 && (
              <p className="text-xs text-gray-500 line-through">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </p>
            )}
            <p className="text-xl font-bold text-emerald-600">
              R$ {lowestPrice.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {product.pixHighlight && (
              <Badge className="bg-pink-600 text-white text-xs h-7 px-3 font-bold">
                PIX
              </Badge>
            )}
            <Button size="sm" className="h-9 w-9 p-0 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Badges de promoção em linha separada */}
        <div className="flex flex-wrap gap-2">
          {product.flashSale && (
            <Badge variant="destructive" className="text-[10px] font-bold">
              OFERTA RELÂMPAGO
            </Badge>
          )}
          {product.freeShipping && (
            <Badge className="bg-emerald-600 text-white text-xs font-bold">
              FRETE GRÁTIS
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}