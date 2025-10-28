import { useQuery } from "@tanstack/react-query"
import { getProducts } from "@/actions/admin/products/get"

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
}