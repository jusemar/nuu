// useFeaturedProducts.ts - VERSÃO CORRIGIDA COM ESTRUTURA REAL
'use client';

import { useProductsByFlag } from '@/features/products/api/queries/use-products-by-flag';

/**
 * Interface baseada na estrutura REAL retornada por getProductsByFlag
 */
export interface FeaturedProduct {
  id: string;
  image: string;
  title: string;
  currentPrice: number;
  description?: string;
  originalPrice?: number;
  discount?: number;
  hasFreeShipping?: boolean;
  isFeatured?: boolean;
  isExclusive?: boolean;
  isTrending?: boolean;
  rating?: number;
  reviewCount?: number;
}

/**
 * Tipo dos dados crus retornados pelo banco (baseado no getProductsByFlag)
 */
interface RawProductFromDB {
  id: string;
  name: string;
  cardShortText?: string;
  description?: string;
  storeProductFlags: string[];
  hasFreeShipping?: boolean;
  mainImage: {
    imageUrl: string;
    altText?: string;
  } | null;
  mainPrice: {
    price: number;          // Em centavos
    promoPrice?: number;    // Em centavos
    hasPromo?: boolean;
    type?: string;
  } | null;
}

/**
 * Hook especializado para produtos em destaque
 */
export const useFeaturedProducts = () => {
  // Buscar produtos com flag 'featured'
  const { data, isLoading, error, refetch } = useProductsByFlag(['featured', 'new', 'sale']);

  // Mapear dados do formato do banco para FeaturedProduct
  const products: FeaturedProduct[] = (data as RawProductFromDB[] || []).map(product => {
    // Preços (convertendo de centavos para reais)
    const originalPriceInCents = product.mainPrice?.price || 0;
    const promoPriceInCents = product.mainPrice?.promoPrice;
    
    // Calcular desconto se houver promoção
    const hasDiscount = product.mainPrice?.hasPromo && promoPriceInCents;
    const discount = hasDiscount && originalPriceInCents > 0
      ? Math.round(((originalPriceInCents - promoPriceInCents!) / originalPriceInCents) * 100)
      : undefined;

    // Determinar preço atual
    const currentPriceInCents = hasDiscount ? promoPriceInCents! : originalPriceInCents;
    
    return {
      id: product.id,
      title: product.name,
      description: product.cardShortText || product.description,
      
      // Converter centavos para reais
      currentPrice: currentPriceInCents / 100,
      originalPrice: originalPriceInCents > 0 ? originalPriceInCents / 100 : undefined,
      discount,
      
      // Imagem
      image: product.mainImage?.imageUrl || '/images/placeholder.jpg',
      
      // Flags
      hasFreeShipping: product.hasFreeShipping || false,
      isFeatured: true, // Sempre true pois filtramos por 'featured'
      isExclusive: product.storeProductFlags.includes('exclusive'),
      isTrending: product.storeProductFlags.includes('trending'),
      
      // Ratings (adicionar depois se tiver no banco)
      rating: undefined, // Não tem no select atual
      reviewCount: undefined, // Não tem no select atual
    };
  });

  return {
    products,
    isLoading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
};

export default useFeaturedProducts;