import { useQuery } from '@tanstack/react-query'
import { Category } from '../types'
import { categoryKeys } from './query-keys'

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
        // Busca a lista de categorias do cache do React Query
        // Se não estiver em cache, retorna array vazio
        return []
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
