// src/hooks/forms/useSkuGenerator.ts
import { useCallback } from "react";

import { gerarSkuProduto } from "@/features/products/lib/gerar-sku-produto";

interface UseSkuGeneratorProps {
  categoryId?: string;
  categoryName?: string;
  brand?: string;
}

export const useSkuGenerator = () => {
  const generateSku = useCallback(
    ({ categoryId, categoryName, brand }: UseSkuGeneratorProps) => {
      return gerarSkuProduto({ nomeCategoria: categoryName, nomeMarca: brand });
    },
    [],
  );

  return {
    generateSku,
  };
};
