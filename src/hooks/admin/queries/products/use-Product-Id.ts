import { useQuery } from "@tanstack/react-query"
import { getProduct } from "@/actions/admin/products/get-id"

export const useProductId = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id, // Só busca se o ID existir
  })
}