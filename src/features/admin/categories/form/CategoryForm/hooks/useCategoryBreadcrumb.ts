"use client"

import { useEffect } from 'react'

/**
 * Hook para gerenciar o breadcrumb da categoria
 * Atualiza automaticamente quando o nome da categoria muda
 */
export const useCategoryBreadcrumb = (categoryName: string) => {
  // Esta função pode ser estendida para lógica mais complexa
  // (ex: hierarquia de subcategorias, caminho completo)
  
  const getBreadcrumbCategoryName = (): string => {
    if (!categoryName || categoryName.trim() === '') {
      return '—' // Retorna traço quando vazio
    }
    return categoryName.trim()
  }

  // Efeito para debug/log (pode ser removido depois)
  useEffect(() => {
    console.log('Breadcrumb atualizado:', getBreadcrumbCategoryName())
  }, [categoryName])

  return {
    breadcrumbCategoryName: getBreadcrumbCategoryName(),
    hasCategoryName: !!categoryName?.trim()
  }
}