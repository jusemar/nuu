/**
 * Hook para listagem, busca e paginação de categorias
 * 
 * Responsabilidades:
 * - Buscar lista de categorias do servidor
 * - Gerenciar paginação e filtros
 * - Cache com TanStack Query
 * - Atualização em tempo real (refetch)
 * 
 * Tecnologias:
 * - TanStack Query (useQuery, useInfiniteQuery)
 * - Zod para validação de resposta
 * - TypeScript para type safety
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'
import { 
  Category, 
  CategoryFilters, 
  PaginatedResponse,
  ApiErrorResponse 
} from '../types'
import { z } from 'zod'

// Schema de validação para resposta da API
const PaginatedCategoriesSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    isActive: z.boolean(),
    metaTitle: z.string().nullable(),
    metaDescription: z.string().nullable(),
    orderIndex: z.number(),
    userId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    subcategoriesCount: z.number()
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
})

// Chaves de query para o TanStack Query
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: CategoryFilters) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  infinite: () => [...categoryKeys.all, 'infinite'] as const
}

/**
 * Hook para buscar lista de categorias com filtros
 */
export function useCategoryList(
  filters?: CategoryFilters,
  options?: UseQueryOptions<Category[], Error>
) {
  return useQuery<Category[], Error>({
    queryKey: categoryKeys.list(filters),
    queryFn: async () => {
      try {
        const categories = await categoryService.listCategories()
        
        // Aplica filtros localmente (pode ser movido para o servidor depois)
        let filtered = [...categories]
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase()
          filtered = filtered.filter(cat => 
            cat.name.toLowerCase().includes(searchLower) ||
            cat.description?.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters?.isActive !== undefined) {
          filtered = filtered.filter(cat => cat.isActive === filters.isActive)
        }
        
        // Ordenação
        if (filters?.sortBy) {
          filtered.sort((a, b) => {
            const aVal = a[filters.sortBy!]
            const bVal = b[filters.sortBy!]
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return filters.sortOrder === 'desc' 
                ? bVal.localeCompare(aVal)
                : aVal.localeCompare(bVal)
            }
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return filters.sortOrder === 'desc' 
                ? bVal - aVal
                : aVal - bVal
            }
            
            if (aVal instanceof Date && bVal instanceof Date) {
              return filters.sortOrder === 'desc'
                ? bVal.getTime() - aVal.getTime()
                : aVal.getTime() - bVal.getTime()
            }
            
            return 0
          })
        }
        
        return filtered
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        throw new Error('Falha ao carregar categorias')
      }
    },
    // Configurações padrão
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...options
  })
}

/**
 * Hook para listagem infinita (scroll infinito) de categorias
 * Útil para listas muito grandes
 */
export function useInfiniteCategoryList(
  filters?: CategoryFilters,
  options?: UseInfiniteQueryOptions<PaginatedResponse<Category>, Error>
) {
  return useInfiniteQuery<PaginatedResponse<Category>, Error>({
    queryKey: [...categoryKeys.infinite(), { filters }],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const limit = 20 // Itens por página
        const offset = (pageParam - 1) * limit
        
        // Nota: Implementação atual não suporta paginação no servidor
        // Esta é uma simulação para a estrutura
        const allCategories = await categoryService.listCategories()
        
        // Aplica filtros
        let filtered = [...allCategories]
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase()
          filtered = filtered.filter(cat => 
            cat.name.toLowerCase().includes(searchLower) ||
            cat.description?.toLowerCase().includes(searchLower)
          )
        }
        
        if (filters?.isActive !== undefined) {
          filtered = filtered.filter(cat => cat.isActive === filters.isActive)
        }
        
        // Paginação simulada
        const paginatedItems = filtered.slice(offset, offset + limit)
        const total = filtered.length
        const totalPages = Math.ceil(total / limit)
        
        const response: PaginatedResponse<Category> = {
          items: paginatedItems,
          pagination: {
            page: pageParam,
            limit,
            total,
            totalPages,
            hasNext: pageParam < totalPages,
            hasPrev: pageParam > 1
          }
        }
        
        // Valida resposta com Zod
        const validated = PaginatedCategoriesSchema.parse({
          items: response.items.map(cat => ({
            ...cat,
            createdAt: cat.createdAt.toISOString(),
            updatedAt: cat.updatedAt.toISOString()
          })),
          pagination: response.pagination
        })
        
        // Converte strings de volta para Date
        return {
          items: validated.items.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          })),
          pagination: validated.pagination
        }
      } catch (error) {
        console.error('Erro na listagem infinita:', error)
        if (error instanceof z.ZodError) {
          throw new Error('Resposta da API inválida')
        }
        throw new Error('Falha ao carregar mais categorias')
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext 
        ? lastPage.pagination.page + 1
        : undefined
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.hasPrev 
        ? firstPage.pagination.page - 1
        : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options
  })
}

/**
 * Hook para busca rápida de categorias (autocomplete/search)
 */
export function useCategorySearch(
  searchTerm: string,
  options?: UseQueryOptions<Category[], Error>
) {
  return useQuery<Category[], Error>({
    queryKey: [...categoryKeys.lists(), 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return []
      
      try {
        const categories = await categoryService.listCategories()
        
        // Busca case-insensitive em nome e descrição
        const term = searchTerm.toLowerCase()
        return categories.filter(cat => 
          cat.name.toLowerCase().includes(term) ||
          cat.description?.toLowerCase().includes(term) ||
          cat.slug.toLowerCase().includes(term)
        ).slice(0, 10) // Limita a 10 resultados
      } catch (error) {
        console.error('Erro na busca de categorias:', error)
        throw new Error('Falha na busca')
      }
    },
    enabled: searchTerm.length >= 2, // Só busca com pelo menos 2 caracteres
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    ...options
  })
}

/**
 * Hook para categorias ativas (dropdowns, selects)
 */
export function useActiveCategories(
  options?: UseQueryOptions<Category[], Error>
) {
  return useQuery<Category[], Error>({
    queryKey: [...categoryKeys.lists(), 'active'],
    queryFn: async () => {
      try {
        const categories = await categoryService.listCategories()
        return categories
          .filter(cat => cat.isActive)
          .sort((a, b) => a.orderIndex - b.orderIndex)
      } catch (error) {
        console.error('Erro ao buscar categorias ativas:', error)
        throw new Error('Falha ao carregar categorias ativas')
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options
  })
}

/**
 * Hook para estatísticas da listagem
 */
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