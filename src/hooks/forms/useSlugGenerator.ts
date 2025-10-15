"use client"

import { useCallback } from 'react'

export const useSlugGenerator = () => {
  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/\s+/g, '-') // Espaços para hífen
      .replace(/[^\w-]+/g, '') // Remove caracteres especiais
      .replace(/--+/g, '-') // Remove hífens duplos
      .replace(/^-+/, '') // Remove hífens do início
      .replace(/-+$/, '') // Remove hífens do final
  }, [])

  return { generateSlug }
}