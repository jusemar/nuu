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

import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getCategoryById, getAllCategories } from '../services/categoryService'
import { Category } from "../types";

// Chaves de query específicas para detalhes
export const categoryDetailKeys = {
  all: ["category-detail"] as const,
  byId: (id: string) => [...categoryDetailKeys.all, "by-id", id] as const,
  bySlug: (slug: string) =>
    [...categoryDetailKeys.all, "by-slug", slug] as const,
  subcategories: (categoryId: string) =>
    [...categoryDetailKeys.all, "subcategories", categoryId] as const,
};

/**
 * Hook para carregar uma categoria completa por ID
 * Inclui subcategorias aninhadas
 */
export function useCategoryDetail(
  id: string | undefined,
  options?: UseQueryOptions<Category, Error>,
) {
  return useQuery<Category, Error>({
    queryKey: categoryDetailKeys.byId(id || ""),
    queryFn: async () => {
      if (!id) {
        throw new Error("ID da categoria é necessário");
      }

      try {
        const category = await getCategoryById(id);

        if (!category) {
          throw new Error("Categoria não encontrada");
        }

        return category;
      } catch (error) {
        console.error(`Erro ao buscar categoria ${id}:`, error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Falha ao carregar detalhes da categoria");
      }
    },
    enabled: !!id, // Só executa se tiver ID
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error) => {
      // Não retenta se for erro 404 (não encontrado)
      if (error.message.includes("não encontrada")) {
        return false;
      }
      return failureCount < 2; // Retenta até 2 vezes
    },
    ...options,
  });
}

/**
 * Hook para carregar categoria por Slug (URL amigável)
 */
export function useCategoryBySlug(
  slug: string | undefined,
  options?: UseQueryOptions<Category, Error>,
) {
  const queryClient = useQueryClient();

  return useQuery<Category, Error>({
    queryKey: categoryDetailKeys.bySlug(slug || ""),
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug da categoria é necessário");
      }

      try {
        // Primeiro busca todas as categorias
        const categories = await getAllCategories();

        // Encontra a categoria pelo slug
        const category = categories.find((cat) => cat.slug === slug);

        if (!category) {
          throw new Error("Categoria não encontrada");
        }

        // Depois busca com subcategorias
        const fullCategory = await getCategoryById(category.id);

        if (!fullCategory) {
          throw new Error("Categoria não encontrada");
        }

        return fullCategory;
      } catch (error) {
        console.error(`Erro ao buscar categoria por slug ${slug}:`, error);
        throw new Error("Falha ao carregar categoria");
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutos (slug muda menos)
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options,
  });
}


/**
 * Hook específico para subcategorias de uma categoria
 * Útil quando só precisa das subcategorias, não dos dados da categoria
 */
export function useCategorySubcategories(
  categoryId: string | undefined,
  options?: UseQueryOptions<Category[], Error>,
) {
  return useQuery<Category[], Error>({
    queryKey: categoryDetailKeys.subcategories(categoryId || ""),
    queryFn: async () => {
      if (!categoryId) {
        throw new Error("ID da categoria é necessário");
      }

      try {
        const category = await getCategoryById(categoryId);
        return category?.subcategories || [];
      } catch (error) {
        console.error(
          `Erro ao buscar subcategorias da categoria ${categoryId}:`,
          error,
        );
        throw new Error("Falha ao carregar subcategorias");
      }
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook para pré-carregar uma categoria
 * Útil para otimização (ex: hover em link)
 */
export function usePrefetchCategory(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: categoryDetailKeys.byId(id),
      queryFn: () => getCategoryById(id),
    });
  };
}

/**
 * Hook para estado otimista de categoria
 * Retorna dados do cache enquanto carrega novos
 */
export function useOptimisticCategory(
  id: string,
  optimisticData?: Partial<Category>,
) {
  const { data, isLoading, isFetching, error } = useCategoryDetail(id);
  const queryClient = useQueryClient();

  // Dados otimistas (do cache ou fornecidos)
  const optimistic = optimisticData ? { ...data, ...optimisticData } : data;

  // Atualização otimista
  const setOptimisticData = (updates: Partial<Category>) => {
    queryClient.setQueryData<Category>(categoryDetailKeys.byId(id), (old) =>
      old ? { ...old, ...updates } : undefined,
    );
  };

  return {
    data: optimistic,
    isLoading,
    isFetching,
    error,
    setOptimisticData,
    // Estados combinados
    isPending: isLoading || isFetching,
    hasData: !!optimistic,
    hasError: !!error,
  };
}

/**
 * Hook para múltiplas categorias simultaneamente
 * Útil para dashboard ou relatórios
 */
export function useMultipleCategories(
  ids: string[],
  options?: UseQueryOptions<Category[], Error>,
) {
  return useQuery<Category[], Error>({
    queryKey: [...categoryDetailKeys.all, "multiple", ...ids],
    queryFn: async () => {
      try {
        const promises = ids.map((id) =>
          getCategoryById(id).catch((error) => {
            console.error(`Erro ao buscar categoria ${id}:`, error);
            return null;
          }),
        );

        const results = await Promise.all(promises);
        return results.filter((cat): cat is Category => cat !== null);
      } catch (error) {
        console.error("Erro ao buscar múltiplas categorias:", error);
        throw new Error("Falha ao carregar categorias");
      }
    },
    enabled: ids.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}

/**
 * Hook utilitário para verificar se categoria existe
 */
export function useCategoryExists(
  id: string | undefined,
  options?: UseQueryOptions<boolean, Error>,
) {
  return useQuery<boolean, Error>({
    queryKey: [...categoryDetailKeys.all, "exists", id],
    queryFn: async () => {
      if (!id) return false;

      try {
        const category = await getCategoryById(id);
        return !!category;
      } catch (error) {
        // Se der erro 404, categoria não existe
        if (
          error instanceof Error &&
          error.message.includes("não encontrada")
        ) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options,
  });
}
