/**
 * HOOK para listagem de categorias
 * =====================================================================
 * Este hook é usado nos componentes React para acessar as categorias.
 * 
 * ARQUITETURA: Feature-based (modular por domínio)
 * TECNOLOGIAS: TanStack Query, TypeScript
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getAllCategories } from '../services/categoryService'
import { categoryKeys } from './query-keys'
import type { Category, CategoryFilters } from '../types'

// =====================================================================
// HOOK PRINCIPAL: useCategoryList
// =====================================================================
export function useCategoryList(
  filters?: CategoryFilters,
  options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Category[], Error>({
    // A chave do cache
    queryKey: categoryKeys.list(filters),
    
    // Função de busca
    queryFn: async () => {
      try {
        // Busca categorias do banco (já ordenadas por updatedAt)
        const categories = await getAllCategories()        
        
        // Aplica filtros
        let filtered = [...categories]
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase()
          filtered = filtered.filter(cat => 
            cat.name.toLowerCase().includes(searchLower) ||
            (cat.description && cat.description.toLowerCase().includes(searchLower))
          )
        }
        
        if (filters?.isActive !== undefined) {
          filtered = filtered.filter(cat => cat.isActive === filters.isActive)
        }
        
        if (filters?.level !== undefined) {
          filtered = filtered.filter(cat => cat.level === filters.level)
        }
        
        if (filters?.parentId !== undefined) {
          filtered = filtered.filter(cat => cat.parentId === filters.parentId)
        }
        
        return filtered
      } catch (error) {
        console.error('❌ [useCategoryList] Erro:', error)
        throw error
      }
    },
    
    // Configurações padrão
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10,   // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 1000,
    
    // Mescla com as opções fornecidas (se houver)
    ...options
  })
}

// =====================================================================
// HOOK AUXILIAR: useActiveCategories
// =====================================================================
export function useActiveCategories(
  options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>
) {
  return useCategoryList(
    { isActive: true },
    {
      staleTime: 1000 * 60 * 10, // 10 minutos
      gcTime: 1000 * 60 * 30,    // 30 minutos
      ...options
    }
  )
}

// =====================================================================
// HOOK AUXILIAR: useCategorySearch
// =====================================================================
export function useCategorySearch(
  searchTerm: string,
  options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>
) {
  return useCategoryList(
    { search: searchTerm },
    {
      enabled: searchTerm.length >= 2,
      staleTime: 1000 * 60 * 2, // 2 minutos
      gcTime: 1000 * 60 * 5,    // 5 minutos
      ...options
    }
  )
}

// =====================================================================
// HOOK AUXILIAR: useRootCategories
// =====================================================================
export function useRootCategories(
  options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>
) {
  return useCategoryList(
    { level: 0 },
    {
      staleTime: 1000 * 60 * 5, // 5 minutos
      ...options
    }
  )
}

// =====================================================================
// HOOK AUXILIAR: useCategoriesByParent
// =====================================================================
export function useCategoriesByParent(
  parentId: string | null,
  options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>
) {
  return useCategoryList(
    { parentId: parentId || undefined },
    {
      enabled: parentId !== null && parentId !== undefined,
      staleTime: 1000 * 60 * 5, // 5 minutos
      ...options
    }
  )
}

// =====================================================================
// HOOK: useCategoryListStats
// =====================================================================
export function useCategoryListStats() {
  const { data: categories } = useCategoryList()
  
  return {
    total: categories?.length || 0,
    active: categories?.filter(c => c.isActive).length || 0,
    inactive: categories?.filter(c => !c.isActive).length || 0,
    withSubcategories: categories?.filter(c => (c as any).subcategoriesCount > 0).length || 0,
    averageOrderIndex: categories?.length 
      ? categories.reduce((sum, cat) => sum + cat.orderIndex, 0) / categories.length
      : 0
  }
}