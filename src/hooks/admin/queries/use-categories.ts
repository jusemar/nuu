// src/hooks/admin/queries/use-categories.ts
import { useQuery } from "@tanstack/react-query"
// REMOVA: import { getCategories } from "@/data/categories/get"

export const useCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/categories')
      if (!response.ok) throw new Error('Erro ao buscar categorias')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}