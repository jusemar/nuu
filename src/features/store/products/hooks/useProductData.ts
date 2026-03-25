// ==========================================
// HOOK: useProductData - Busca dados do produto
// ==========================================
// Responsabilidade: Buscar produto no banco/service
// Retorna: dados, loading, erro e função de refresh

import { useState, useEffect, useCallback } from 'react';
import type { Produto } from '../types/product.types';
import { getProductBySku } from '../service/productService';

interface UseProductDataReturn {
  produto: Produto | null;      // Dados do produto
  loading: boolean;              // Estado de carregamento
  error: string | null;          // Mensagem de erro
  refetch: () => void;           // Função para recarregar
}

/**
 * Hook para buscar dados de um produto pelo SKU
 * 
 * @param sku - Código do produto (ex: "ATH-RUN-PRX-42")
 * @returns Objeto com produto, loading, erro e refetch
 * 
 * EXEMPLO DE USO:
 * const { produto, loading, error } = useProductData("ATH-RUN-PRX-42");
 */
export function useProductData(sku: string): UseProductDataReturn {
  // Estados do hook
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função de busca (useCallback evita recriação desnecessária)
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getProductBySku(sku);
      
      if (response.error) {
        setError(response.error);
        setProduto(null);
      } else {
        setProduto(response.data);
      }
    } catch (err) {
      setError('Erro ao carregar produto');
      setProduto(null);
    } finally {
      setLoading(false);
    }
  }, [sku]); // Recria apenas se SKU mudar

  // Executa busca quando componente monta ou SKU muda
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Retorna tudo que o componente precisa
  return {
    produto,
    loading,
    error,
    refetch: fetchProduct, // Permite recarregar manualmente
  };
}