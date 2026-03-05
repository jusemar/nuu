// hooks/admin/queries/products/use-products.ts
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "@/actions/admin/products/get"

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const products = await getProducts();          
      return products;
    },
  })
}