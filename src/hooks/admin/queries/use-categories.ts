import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@/actions/admin/categories/get" // ← import da server action

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'], // ← MUDOU para ['categories']
    queryFn: getCategories, // ← usa server action direta
  })
}