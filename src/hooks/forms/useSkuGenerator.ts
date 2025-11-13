// src/hooks/forms/useSkuGenerator.ts
import { useCallback } from 'react'

interface UseSkuGeneratorProps {
  categoryId?: string
  categoryName?: string
  brand?: string
}

export const useSkuGenerator = () => {
  const generateSku = useCallback(({
    categoryId,
    categoryName,
    brand
  }: UseSkuGeneratorProps) => {
    // Usar o nome da categoria se disponível, caso contrário usar 'Geral'
    const categoryCode = categoryName?.slice(0, 3).toUpperCase() || 'GEN'
    const brandCode = brand?.slice(0, 4).toUpperCase() || 'PROD'
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${categoryCode}-${brandCode}-${randomNum}`
  }, [])

  return {
    generateSku
  }
}