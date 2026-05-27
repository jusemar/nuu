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
}

interface DealsCarouselProps {
  products?: DealProduct[]; // Opcional, usa mock se não fornecido
}

const DealsCarousel = ({ products: propProducts }: DealsCarouselProps) => {
  // Dados MOCK para teste visual
  const mockProducts: DealProduct[] = [
    {
      id: "6",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      title: "Tênis de Corrida Pro",
      description: "Amortecimento máximo, leve 280g",
      originalPrice: 399.99,
      currentPrice: 299.99,
      discount: 25,
      hasFreeShipping: true,
    },
    {
      id: "7",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
      title: "Tênis Nike Air Max",
      description: "Design moderno, conforto premium",
      currentPrice: 349.99,
      isFeatured: true,
    },
    {
      id: "8",
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
      title: "Tênis Adidas Ultraboost",
      description: "Energia infinita, tecnologia Boost",
      originalPrice: 499.99,
      currentPrice: 399.99,
      discount: 20,
      isExclusive: true,
    },
    {
      id: "9",
      image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329",
      title: "Tênis Casual Converse",
      description: "Estilo clássico, versátil",
      currentPrice: 199.99,
      hasFreeShipping: true,
    },
    {
      id: "10",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
      title: "Tênis Esportivo Puma",
      description: "Performance atlética",
      originalPrice: 279.99,
      currentPrice: 199.99,
      discount: 29,
      isFeatured: true,
    },
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      title: "Fones de Ouvido Premium",
      description: "Cancelamento de ruído ativo, 30h bateria",
      originalPrice: 299.99,
      currentPrice: 199.99,
      discount: 33,
      hasFreeShipping: true,
      isFeatured: true,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
      title: "Câmera Profissional 4K",
      description: "Sensor full-frame, gravação em 4K60fps",
      originalPrice: 899.99,
      currentPrice: 749.99,
      discount: 17,
      isExclusive: true,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
      title: "Smartwatch Esportivo",
      description: "Monitor cardíaco, GPS, à prova d'água",
      currentPrice: 249.99,
      hasFreeShipping: true,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1556656793-08538906a9f8",
      title: "Notebook Ultrafino",
      description: "16GB RAM, SSD 512GB, tela 4K",
      originalPrice: 1299.99,
      currentPrice: 1099.99,
      isFeatured: true,
    },
    {
      id: "5",
      image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86",
      title: "Tênis Esportivo",
      description: "Amortecimento premium, para corrida",
      currentPrice: 129.99,
      discount: 20,
      hasFreeShipping: true,
    },
  ];

  const products = propProducts || mockProducts;
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
