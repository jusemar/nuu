import { useQuery } from "@tanstack/react-query"
import { getProductById } from "@/features/admin/products/service/getProductById"


export const useProductId = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  })
}