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

// No componente:
<Carousel
  plugins={[
    Autoplay({
      delay: 20000, // 0 segundos
      stopOnInteraction: false,
    }),
  ]}
  opts={{
    align: "start",
    loop: true,
  }}
  className="mx-auto w-full max-w-7xl" // Centraliza e limita largura
></Carousel>;

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
  badgePromocao?: "normal" | "relampago";
}

interface DealsCarouselProps {
  products?: DealProduct[];
}

const DealsCarousel = ({ products: propProducts }: DealsCarouselProps) => {
  const products = propProducts ?? [];
  if (products.length === 0) return null;

  return (
    <div className="relative px-4 lg:flex lg:h-full lg:min-h-[490px] lg:items-center lg:pt-14">
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
              className="basis-[224px] pl-2 md:basis-[232px]"
            >
              <div className="px-1 pb-1">
                <FeaturedProductCard {...product} className="h-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4" /> {/* Ajusta posição setas */}
        <CarouselNext className="-right-4" />
      </Carousel>
    </div>
  );
};

export default DealsCarousel;
