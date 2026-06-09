// useFeaturedProducts.ts - VERSÃO FINAL OTIMIZADA
"use client";

import { useProductsByFlag } from "@/features/products/api/queries/use-products-by-flag";
import { UseQueryResult } from "@tanstack/react-query";

/**
 * 🏷️ INTERFACE: Dados crus retornados do banco
 * Baseada na estrutura REAL do getProductsByFlag.ts
 * Cada propriedade corresponde ao que o banco retorna
 */
interface RawProductFromDB {
  id: string;
  slug: string;
  name: string; // Nome do produto no banco
  cardShortText?: string; // Texto curto para card (opcional)
  description?: string; // Descrição completa (opcional)
  storeProductFlags: string[]; // Array de flags: ['featured', 'sale', etc]
  hasFreeShipping?: boolean; // Frete grátis (opcional)
  mainImage: {
    imageUrl: string; // URL da imagem principal
    altText?: string; // Texto alternativo (opcional)
  } | null; // Pode ser null se não tiver imagem
  mainPrice: {
    price: number; // Preço normal EM CENTAVOS
    promoPrice?: number; // Preço promocional EM CENTAVOS (opcional)
    hasPromo?: boolean; // Tem promoção ativa?
    promoType?: string | null;
    promoEndDate?: Date | string | null;
    type?: string; // Tipo de preço
    percentualOff?: number;
    economiaEmCentavos?: number;
    badgePromocional?: "promocao" | "relampago" | null;
  } | null; // Pode ser null se não tiver preço
}

/**
 * 🏷️ INTERFACE: Produto formatado para o componente FeaturedProductCard
 * Esta interface DEVE estar sincronizada com FeaturedProductCardProps
 */
export interface FeaturedProduct {
  // 🔴 OBRIGATÓRIOS (o card não funciona sem):
  id: string;
  slug: string;
  image: string;
  title: string;
  currentPrice: number;

  // 🟡 OPCIONAIS (o card tem valores padrão):
  description?: string;
  originalPrice?: number;
  discount?: number;
  hasFreeShipping?: boolean;
  isFeatured?: boolean;
  isExclusive?: boolean;
  isTrending?: boolean;
  badgePromocao?: "promocao" | "relampago" | null;
  rating?: number;
  reviewCount?: number;
}

/**
 * 🎯 HOOK PRINCIPAL: useFeaturedProducts
 *
 * 📦 RESPONSABILIDADE: Transformar dados do banco para a UI
 * ✅ VANTAGENS DESTA ABORDAGEM:
 * 1. Separação clara: dados brutos ≠ dados da UI
 * 2. Manutenção fácil: muda só aqui se o banco mudar
 * 3. Reutilização: outros componentes usam a mesma transformação
 * 4. Testabilidade: fácil mockar dados
 */
export const useFeaturedProducts = () => {
  // 🔄 PASSO 1: Buscar dados crus do banco
  // useProductsByFlag já gerencia: cache, loading, error, retry
  const queryResult = useProductsByFlag(["featured", "new"]) as UseQueryResult<
    RawProductFromDB[],
    Error
  >;
  const { data, isLoading, error, refetch } = queryResult;

  // 🔄 PASSO 2: Transformar dados do banco para o formato da UI
  const products: FeaturedProduct[] = (data || []).map((product) => {
    // 💰 CONVERSÃO DE PREÇOS: Banco usa centavos, UI usa reais
    const originalPriceInCents = product.mainPrice?.price || 0;
    const promoPriceInCents = product.mainPrice?.promoPrice;
    const hasPromo = product.mainPrice?.hasPromo;
    const discount =
      product.mainPrice?.percentualOff && product.mainPrice.percentualOff > 0
        ? product.mainPrice.percentualOff
        : undefined;

    // 💵 DETERMINAR PREÇO ATUAL: Promoção tem prioridade
    const currentPriceInCents =
      hasPromo && promoPriceInCents ? promoPriceInCents : originalPriceInCents;

    // 🖼️ TRATAMENTO DE IMAGEM: Fallback se não tiver
    let imageUrl = "/images/product-placeholder.jpg";
    if (product.mainImage?.imageUrl) {
      // Se tiver base URL configurada, adiciona (ex: CDN)
      const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";
      imageUrl = `${baseUrl}${product.mainImage.imageUrl}`;
    }

    // 🏷️ VERIFICAR FLAGS: storeProductFlags é um array
    const storeFlags = product.storeProductFlags || [];

    return {
      // 📋 DADOS BÁSICOS
      id: product.id,
      slug: product.slug,
      title: product.name, // Banco usa 'name', UI usa 'title'

      // 📝 DESCRIÇÃO: Texto curto do card tem prioridade
      description: product.cardShortText || product.description,

      // 💰 PREÇOS (convertidos para reais)
      currentPrice: currentPriceInCents / 100, // ÷100 centavos → reais
      originalPrice:
        originalPriceInCents > 0 ? originalPriceInCents / 100 : undefined,
      discount,

      // 🖼️ IMAGEM (com fallback)
      image: imageUrl,

      // 🚚 FRETE
      hasFreeShipping: product.hasFreeShipping || false,

      // 🏷️ FLAGS ESPECIAIS
      isFeatured: true, // Sempre true, pois filtramos por 'featured'
      isExclusive: storeFlags.includes("exclusive"),
      isTrending: storeFlags.includes("trending"),
      badgePromocao: product.mainPrice?.badgePromocional ?? null,

      // ⭐ AVALIAÇÕES (adicionar quando tiver no banco)
      rating: undefined,
      reviewCount: undefined,
    };
  });

  // 📤 RETORNO FINAL: Mesma interface do hook anterior
  return {
    products, // Array formatado para a UI
    isLoading, // Estado de carregamento
    error, // Erro (se houver)
    refetch: async () => {
      // 🔄 Função para recarregar dados manualmente
      await refetch();
    },
  };
};

export default useFeaturedProducts;
