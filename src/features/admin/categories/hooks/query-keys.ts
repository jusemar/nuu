/**
 * Chaves de query para categorias (TanStack Query)
 * 
 * Centraliza todas as chaves para evitar importações circulares
 * e garantir consistência entre diferentes hooks
 */

export const categoryKeys = {
  // Base key para todas as queries de categorias
  all: ['categories'] as const,
  
  // Listas
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: any) => [...categoryKeys.lists(), { filters }] as const,
  
  // Detalhes
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  
  // Infinito (scroll)
  infinite: () => [...categoryKeys.all, 'infinite'] as const,
  infiniteList: (filters?: any) => [...categoryKeys.infinite(), { filters }] as const,
  
  // Busca
  searches: () => [...categoryKeys.all, 'search'] as const,
  search: (searchTerm: string) => [...categoryKeys.searches(), searchTerm] as const,
  
  // Específicos
  active: () => [...categoryKeys.lists(), 'active'] as const,
  stats: () => [...categoryKeys.all, 'stats'] as const,
  
  // Subcategorias
  subcategories: (categoryId: string) => [...categoryKeys.detail(categoryId), 'subcategories'] as const,
  
  // Para uso em mutations (optimistic updates)
  mutation: {
    list: () => categoryKeys.lists(),
    detail: (id: string) => categoryKeys.detail(id),
    allLists: () => categoryKeys.all,
  }
} as const;

// Alias para compatibilidade com código existente
export const categoryDetailKeys = {
  all: categoryKeys.details(),
  byId: categoryKeys.detail,
} as const;