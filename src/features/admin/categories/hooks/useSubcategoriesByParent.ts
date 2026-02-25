import { useQuery } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'
import { Category } from '../types'

/**
 * Hook para carregar subcategorias de uma categoria pai
 * Usado para lazy loading quando o usuário expande uma categoria
 */
export function useSubcategoriesByParent(parentId: string | null | undefined) {
  return useQuery<Category[], Error>({
    queryKey: ['subcategories', parentId],
    queryFn: async () => {
      if (!parentId) return []
      
      try {
        // Busca todas as categorias e filtra pela parentId
        const allCategories = await categoryService.listCategories()
        return allCategories.filter((cat: any) => cat.parentId === parentId)
      } catch (error) {
        console.error('Erro ao buscar subcategorias:', error)
        throw new Error('Falha ao carregar subcategorias')
      }
    },
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}
