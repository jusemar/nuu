// src/features/product-card/components/ProductCard.tsx
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useProductCard } from "../hooks/useProductCard";
import { Product } from "@/features/product-card/types";


export function ProductCard({ product }: { product: Product }) {
  const {
    lowestPrice,
    mainPrice,
    isFavorite,
    isAdding,
    toggleFavorite,
    addToCart,
  } = useProductCard(product);

  return (
    <div className="group relative bg-white rounded-50 rounded-xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
    
      <Button
        onClick={toggleFavorite}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition"
      >
        <Heart
          className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
        />
      </Button>
    

      {/* Imagem com hover zoom */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image || "/placeholder.jpg"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Categoria pequena */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category}
        </p>

        {/* Nome do produto */}
        <h3 className="font-medium text-base line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {/* Preços – MELHOR PRÁTICA UX 2025 */}
        <div className="space-y-1">
          {lowestPrice < mainPrice && (
            <p className="text-sm text-muted-foreground line-through">
              De R$ {mainPrice.toFixed(2).replace(".", ",")}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              R$ {lowestPrice.toFixed(2).replace(".", ",")}
            </span>
            {lowestPrice < mainPrice && (
              <Badge variant="destructive" className="text-xs">
                Melhor preço!
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {product.hasMultiplePrices && "A partir de • várias opções de estoque"}
        </div>

        {/* Botão de compra – animação moderna */}
        <Button
          onClick={addToCart}
          disabled={isAdding}
          className="w-full h-11 rounded-lg font-medium"
        >
          {isAdding ? (
            "Adicionando..."
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar ao carrinho
            </>
          )}
        </Button>

        {/* Texto sutil com mais opções (clicável em breve) */}
        {product.hasMultiplePrices && (
          <p className="text-center text-xs text-primary cursor-pointer hover:underline">
            Ver todas as opções de preço e prazo →
          </p>
        )}
      </div>
    </div>
  );
}