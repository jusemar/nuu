"use client";

import { ProductCard } from "@/features/product-card/components/ProductCard";
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
      delay: 10000, // 7 segundos
      stopOnInteraction: false,
    }),
  ]}
  opts={{
    align: "start",
    loop: true,
  }}
  className="w-full max-w-7xl mx-auto" // Centraliza e limita largura
>

</Carousel>

// Tipo para os dados mock (formato que ProductCard espera)
interface DealProduct {
  id: string;
  image: string;
  title: string;
  description?: string;
  originalPrice?: number;
  currentPrice: number;
  discount?: number;
  hasFreeShipping?: boolean;
  hasFlashSale?: boolean;
  hasBestPrice?: boolean;
}

interface DealsCarouselProps {
  products?: DealProduct[]; // Opcional, usa mock se não fornecido
  title?: string;
}

const DealsCarousel = ({ 
  products: propProducts, 
  title = "🔥 Ofertas Especiais" 
}: DealsCarouselProps) => {
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
    hasFlashSale: true,
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
    title: "Tênis Adidas Ultraboost",
    description: "Energia infinita, tecnologia Boost",
    originalPrice: 499.99,
    currentPrice: 399.99,
    discount: 20,
    hasBestPrice: true,
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
    hasFlashSale: true,
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
      hasFlashSale: true,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
      title: "Câmera Profissional 4K",
      description: "Sensor full-frame, gravação em 4K60fps",
      originalPrice: 899.99,
      currentPrice: 749.99,
      discount: 17,
      hasBestPrice: true,
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
      hasFlashSale: true,
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
    <div className="relative my-8 px-4">
      {/* Título */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      {/* Carousel */}
 <Carousel
  plugins={[
    Autoplay({
      delay: 3000, // 3 segundos
      stopOnInteraction: false,
    }),
  ]}
  opts={{
    align: "start",
    loop: true,
  }}
  className="w-full max-w-7xl mx-auto"
>
    
    
    <CarouselContent className="-ml-2"> {/* Reduz margem esquerda */}
    {products.map((product) => (
      <CarouselItem 
        key={product.id} 
        // Ajuste responsivo:
        className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
      >
        <div className="p-1"> {/* Reduz padding interno */}
          <ProductCard
            {...product}
            className="h-full"
          />
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