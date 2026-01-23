"use client"

import { useCallback } from 'react'

/**
 * Hook para gerar slugs de forma consistente
 * Um slug é uma versão de texto amigável para URLs
 * Exemplo: "Produtos Eletrônicos" → "produtos-eletronicos"
 */
export const useSlugGenerator = () => {
  const generateSlug = useCallback((text: string): string => {
    if (!text || text.trim() === '') {
      return ''
    }
    
    return text
      .toLowerCase() // Converte para minúsculas
      .normalize('NFD') // Separa letras de acentos (Normalization Form Decomposed)
      .replace(/[\u0300-\u036f]/g, '') // Remove todos os diacríticos (acentos)
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/[^\w-]+/g, '') // Remove tudo que não for letra, número ou hífen
      .replace(/--+/g, '-') // Remove hífens duplicados
      .replace(/^-+/, '') // Remove hífens do início
      .replace(/-+$/, '') // Remove hífens do final
  }, [])

  return { generateSlug }
}