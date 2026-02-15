import { useQuery } from '@tanstack/react-query'
import { getAllCategories, type Category } from '../services/categoryService'
import { categoryKeys } from './query-keys'

export function useCategoryList() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => getAllCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}