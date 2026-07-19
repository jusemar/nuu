"use client";

import { useCallback } from "react";
import { normalizarSlugCategoria } from "../../../lib/slug-categoria";

/**
 * Hook para gerar slugs de forma consistente
 * Um slug é uma versão de texto amigável para URLs
 * Exemplo: "Produtos Eletrônicos" → "produtos-eletronicos"
 */
export const useSlugGenerator = () => {
  const generateSlug = useCallback((text: string): string => {
    if (!text || text.trim() === "") {
      return "";
    }

    return normalizarSlugCategoria(text);
  }, []);

  return { generateSlug };
};
