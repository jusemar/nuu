"use client";

import { productTable, productVariantTable } from "@/db/schema";
import ProductItem from "./product-item";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductCarouselProps {
  title: string;
  products: (typeof productTable.$inferSelect & {
    variants: (typeof productVariantTable.$inferSelect)[];
  })[];
}

const ProductCarousel = ({ title, products }: ProductCarouselProps) => {
  if (products.length === 0) return null;

  return (
    <div className="relative my-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6">
              <div className="p-1">
                <ProductItem product={product} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Setas de navegação */}
        <CarouselPrevious className="left-2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50" />
        <CarouselNext className="right-2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50" />
      </Carousel>
    </div>
  );
};

export default ProductCarousel;