/**
 * Hook para carregar detalhes de uma categoria específica
 * 
 * Responsabilidades:
 * - Buscar categoria por ID/Slug
 * - Carregar subcategorias aninhadas
 * - Gerenciar estado de loading/error
 * - Cache individual por categoria
 * - Pré-carregamento (prefetch)
 * 
 * Casos de uso:
 * - Página de edição de categoria
 * - Preview de categoria
 * - Formulário com subcategorias
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { getCategoryByIdServer } from '../services/categoryService.server'
import { 
  CategoryWithSubcategories, 
  Category,
  SubcategoryWithChildren
} from '../types'
import { categoryKeys } from './useCategoryList'

// Chaves de query específicas para detalhes
export const categoryDetailKeys = {
  all: ['category-detail'] as const,
  byId: (id: string) => [...categoryDetailKeys.all, 'by-id', id] as const,
  bySlug: (slug: string) => [...categoryDetailKeys.all, 'by-slug', slug] as const,
  subcategories: (categoryId: string) => [...categoryDetailKeys.all, 'subcategories', categoryId] as const
}

/**
 * Hook para carregar uma categoria completa por ID
 * Inclui subcategorias aninhadas
 */
export function useCategoryDetail(
  id: string | undefined,
  options?: UseQueryOptions<CategoryWithSubcategories, Error>
) {
  return useQuery<CategoryWithSubcategories, Error>({
    queryKey: categoryDetailKeys.byId(id || ''),
    queryFn: async () => {
      if (!id) {
        console.error('[useCategoryDetail] ❌ ID da categoria é necessário')
        throw new Error('ID da categoria é necessário')
      }
      
      console.log('[useCategoryDetail] 🔍 Iniciando busca para ID:', id)
      
      try {
        console.log('[useCategoryDetail] 📡 Chamando getCategoryByIdServer')
        const result = await getCategoryByIdServer(id)
        
        if (!result.success || !result.data) {
          console.error('[useCategoryDetail] ❌ Erro na resposta do servidor:', result.message)
          throw new Error(result.message || 'Falha ao carregar categoria')
        }
        
        console.log('[useCategoryDetail] ✅ Categoria carregada:', result.data?.name)
        return result.data
      } catch (error) {
        console.error(`[useCategoryDetail] ❌ Erro ao buscar categoria ${id}:`, error)
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Falha ao carregar detalhes da categoria')
      }
    },
    enabled: !!id, // Só executa se tiver ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // Não retenta se for erro 404 (não encontrado)
      if (error.message.includes('não encontrada')) {
        return false
      }
      return failureCount < 2 // Retenta até 2 vezes
    },
    ...options
  })
}

/**
 * Hook para carregar categoria por Slug (URL amigável)
 */
export function useCategoryBySlug(
  slug: string | undefined,
  options?: UseQueryOptions<CategoryWithSubcategories, Error>
) {
  const queryClient = useQueryClient()
  
  return useQuery<CategoryWithSubcategories, Error>({
    queryKey: categoryDetailKeys.bySlug(slug || ''),
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug da categoria é necessário')
      }
      
      try {
        // Primeiro busca todas as categorias
        const categories = await categoryService.listCategories()
        
        // Encontra a categoria pelo slug
        const category = categories.find(cat => cat.slug === slug)
        
        if (!category) {
          throw new Error('Categoria não encontrada')
        }
        
        // Depois busca com subcategorias
        const fullCategory = await categoryService.getCategoryWithSubcategories(category.id)
        
        if (!fullCategory) {
          throw new Error('Categoria não encontrada')
        }
        
        return fullCategory
      } catch (error) {
        console.error(`Erro ao buscar categoria por slug ${slug}:`, error)
        throw new Error('Falha ao carregar categoria')
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutos (slug muda menos)
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options
  })
}

/**
 * Hook específico para subcategorias de uma categoria
 * Útil quando só precisa das subcategorias, não dos dados da categoria
 */
export function useCategorySubcategories(
  categoryId: string | undefined,
  options?: UseQueryOptions<SubcategoryWithChildren[], Error>
) {
  const { data: categoryDetail } = useCategoryDetail(categoryId, {
    ...options,
    enabled: !!categoryId && (options?.enabled !== false)
  })
  
  // Hook separado que extrai só as subcategorias
  return useQuery<SubcategoryWithChildren[], Error>({
    queryKey: categoryDetailKeys.subcategories(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) {
        throw new Error('ID da categoria é necessário')
      }
      
      try {
        const category = await categoryService.getCategoryWithSubcategories(categoryId)
        return category?.subcategories || []
      } catch (error) {
        console.error(`Erro ao buscar subcategorias da categoria ${categoryId}:`, error)
        throw new Error('Falha ao carregar subcategorias')
      }
    },
    enabled: !!categoryId && !categoryDetail, // Só busca se não tiver os dados do detail
    initialData: categoryDetail?.subcategories,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options
  })
}

/**
 * Hook para pré-carregar uma categoria
 * Útil para otimização (ex: hover em link)
 */
export function usePrefetchCategory(id: string) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: categoryDetailKeys.byId(id),
      queryFn: () => categoryService.getCategoryWithSubcategories(id)
    })
  }
}

/**
 * Hook para estado otimista de categoria
 * Retorna dados do cache enquanto carrega novos
 */
export function useOptimisticCategory(
  id: string,
  optimisticData?: Partial<CategoryWithSubcategories>
) {
  const { data, isLoading, isFetching, error } = useCategoryDetail(id)
  const queryClient = useQueryClient()
  
  // Dados otimistas (do cache ou fornecidos)
  const optimistic = optimisticData 
    ? { ...data, ...optimisticData }
    : data
  
  // Atualização otimista
  const setOptimisticData = (updates: Partial<CategoryWithSubcategories>) => {
    queryClient.setQueryData<CategoryWithSubcategories>(
      categoryDetailKeys.byId(id),
      (old) => old ? { ...old, ...updates } : undefined
    )
  }
  
  return {
    data: optimistic,
    isLoading,
    isFetching,
    error,
    setOptimisticData,
    // Estados combinados
    isPending: isLoading || isFetching,
    hasData: !!optimistic,
    hasError: !!error
  }
}

/**
 * Hook para múltiplas categorias simultaneamente
 * Útil para dashboard ou relatórios
 */
export function useMultipleCategories(
  ids: string[],
  options?: UseQueryOptions<Category[], Error>
) {
  return useQuery<Category[], Error>({
    queryKey: [...categoryDetailKeys.all, 'multiple', ...ids],
    queryFn: async () => {
      try {
        const promises = ids.map(id => 
          categoryService.getCategoryWithSubcategories(id)
            .catch(error => {
              console.error(`Erro ao buscar categoria ${id}:`, error)
              return null
            })
        )
        
        const results = await Promise.all(promises)
        return results.filter((cat): cat is CategoryWithSubcategories => cat !== null)
      } catch (error) {
        console.error('Erro ao buscar múltiplas categorias:', error)
        throw new Error('Falha ao carregar categorias')
      }
    },
    enabled: ids.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    ...options
  })
}

/**
 * Hook utilitário para verificar se categoria existe
 */
export function useCategoryExists(
  id: string | undefined,
  options?: UseQueryOptions<boolean, Error>
) {
  return useQuery<boolean, Error>({
    queryKey: [...categoryDetailKeys.all, 'exists', id],
    queryFn: async () => {
      if (!id) return false
      
      try {
        const category = await categoryService.getCategoryWithSubcategories(id)
        return !!category
      } catch (error) {
        // Se der erro 404, categoria não existe
        if (error instanceof Error && error.message.includes('não encontrada')) {
          return false
        }
        throw error
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options
  })
}