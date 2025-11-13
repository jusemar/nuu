// src/components/common/flash-deal-card.tsx
"use client";

import { CountdownTimer } from "@/components/ui/countdown-timer";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { productTable, productVariantTable } from "@/db/schema";
import { formatCentsToBRL } from "@/helpers/money";

interface FlashDealCardProps {
  product: typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  };
  endDate: string; // ← NOVA PROP
}

export const FlashDealCard = ({ product, endDate }: FlashDealCardProps) => {
  const firstVariant = product.variants[0];

  return (
    <Card className="bg-gradient-to-br from-red-500 to-orange-500 border-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Badge no topo da imagem */}
        <div className="relative">
         {firstVariant?.imageUrl ? (
  <Image
    src={firstVariant.imageUrl}
    alt={product.name}
    width={300}
    height={200}
  />
) : (
  <div>Imagem não disponível</div>
)}
          <div className="absolute top-3 left-3">
            <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full">
              🔥 OFERTA RELÂMPAGO
            </span>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="p-4 text-white">
          {/* Informações do produto */}
          <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
          <p className="text-sm opacity-90 mb-2 truncate">{product.description}</p>
          
          {/* Preço */}
          <div className="flex items-center gap-2 mb-4">
           {firstVariant ? (
              <span className="text-2xl font-bold">
                {formatCentsToBRL(firstVariant.priceInCents)}
              </span>
            ) : (
              <span className="text-2xl font-bold">Preço não disponível</span>
            )}
          </div>

          {/* Contador com data fixa */}
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2 flex items-center justify-center gap-1">
              ⏰ Termina em breve
            </p>
            <CountdownTimer targetDate={endDate} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};