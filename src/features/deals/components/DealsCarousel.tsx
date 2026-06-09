"use client";

import { FeaturedProductCard } from "@/features/featured-products-carousel/components/FeaturedProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// O carousel de ofertas usa o mesmo contrato visual dos cards de "Os mais queridos".
interface DealProduct {
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
  badgePromocao?: "promocao" | "relampago" | null;
}

interface DealsCarouselProps {
  products?: DealProduct[];
}

const DealsCarousel = ({ products: propProducts }: DealsCarouselProps) => {
  const products = propProducts ?? [];
  if (products.length === 0) return null;

  return (
    <div className="border-border/80 bg-card shadow-elevation relative rounded-xl border px-3 py-4 sm:px-4 lg:flex lg:h-full lg:min-h-[468px] lg:items-center lg:pt-12">
      {/* Carousel */}
      <Carousel
        plugins={[
          Autoplay({
            delay: 7000, // 7 segundos
            stopOnInteraction: false,
          }),
        ]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="mx-auto w-full max-w-7xl"
      >
        {/* Margem e padding mantem os cards alinhados no trilho de ofertas. */}
        <CarouselContent className="-ml-2">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              // A largura fixa evita que o carousel comprima o card dentro da coluna de ofertas.
              className="basis-[218px] pl-2 sm:basis-[232px]"
            >
              <div className="px-1 pb-1">
                <FeaturedProductCard {...product} className="h-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-border bg-card text-primary hover:bg-primary-light -left-2 shadow-sm" />
        <CarouselNext className="border-border bg-card text-primary hover:bg-primary-light -right-2 shadow-sm" />
      </Carousel>
    </div>
  );
};

export default DealsCarousel;
