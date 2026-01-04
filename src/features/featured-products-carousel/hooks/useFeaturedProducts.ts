// useFeaturedProducts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Interface que define a estrutura de um produto em destaque.
 * Baseada nas props que o FeaturedProductCard espera receber.
 * 
 * IMPORTANTE: Esta interface deve estar sempre sincronizada com
 * a interface FeaturedProductCardProps do componente de card.
 */
export interface FeaturedProduct {
  // Props obrigatórias (o card não funciona sem elas)
  id: string;
  image: string;
  title: string;
  currentPrice: number;
  
  // Props opcionais (o card tem valores padrão para elas)
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
 * Interface que define o retorno do nosso hook.
 * Padrão comum em hooks de fetching de dados.
 */
export interface UseFeaturedProductsResult {
  // Array de produtos em destaque
  products: FeaturedProduct[];
  
  // Estado de carregamento (true enquanto busca dados)
  isLoading: boolean;
  
  // Objeto de erro se algo der errado, null se tudo ok
  error: Error | null;
  
  // Função para buscar os dados novamente (útil para refresh)
  refetch: () => Promise<void>;
}

/**
 * Hook customizado para buscar produtos em destaque.
 * 
 * POR QUE USAR UM HOOK?
 * 1. Separa a lógica de dados da UI
 * 2. Pode ser reutilizado em vários componentes
 * 3. Fácil de testar isoladamente
 * 4. Centraliza o tratamento de erros e loading
 * 
 * @returns {UseFeaturedProductsResult} Objeto com produtos, estados e função de refetch
 */
export const useFeaturedProducts = (): UseFeaturedProductsResult => {
  // ESTADO 1: Armazena os produtos buscados
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  
  // ESTADO 2: Controla se está carregando (mostrar spinner/skeleton)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // ESTADO 3: Armazena erro se a busca falhar
  const [error, setError] = useState<Error | null>(null);

  /**
   * Função que busca os produtos em destaque.
   * useCallback memoiza a função para não recriar a cada render
   */
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      // 1. Inicia loading e limpa erros anteriores
      setIsLoading(true);
      setError(null);

      // 2. SIMULAÇÃO: Aqui viria sua chamada real à API
      // Exemplo real: const response = await fetch('/api/products/featured');
      // Exemplo real: const data = await response.json();
      
      // 3. DADOS MOCK temporários (substituir pela API real depois)
      const mockProducts: FeaturedProduct[] = [
        {
          id: '1',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
          title: 'Smart Watch Pro',
          description: 'Relógio inteligente premium com monitoramento de saúde',
          originalPrice: 899.90,
          currentPrice: 699.90,
          discount: 22,
          hasFreeShipping: true,
          isFeatured: true,
          isExclusive: true,
          rating: 4.8,
          reviewCount: 127,
        },
        {
          id: '2',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          title: 'Fone Bluetooth Premium',
          description: 'Cancelamento de ruído ativo com 40h de bateria',
          originalPrice: 599.90,
          currentPrice: 449.90,
          hasFreeShipping: true,
          isFeatured: true,
          isTrending: true,
          rating: 4.6,
          reviewCount: 89,
        },
        {
          id: '3',
          image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
          title: 'Caixa de Som Portátil',
          description: 'Som surround à prova d\'água IPX7',
          currentPrice: 329.90,
          hasFreeShipping: false,
          isFeatured: true,
          rating: 4.7,
          reviewCount: 56,
        },
      ];

      // 4. Simula delay de rede (remover quando usar API real)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Atualiza estado com os produtos buscados
      setProducts(mockProducts);

    } catch (err) {
      // 6. Se der erro, captura e atualiza estado de erro
      console.error('Erro ao buscar produtos em destaque:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      // 7. Finaliza loading (executa tanto no success quanto no error)
      setIsLoading(false);
    }
  }, []); // Array vazio = função criada apenas uma vez

  /**
   * useEffect executa a busca quando o componente monta
   * e quando fetchFeaturedProducts muda (nunca nesse caso)
   */
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  /**
   * Retorna o objeto com dados e funções para o componente usar
   */
  return {
    products,      // Array de produtos
    isLoading,     // Booleano de loading
    error,         // Objeto de erro ou null
    refetch: fetchFeaturedProducts, // Função para buscar novamente
  };
};

export default useFeaturedProducts;   