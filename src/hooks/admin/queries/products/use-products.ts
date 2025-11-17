// hooks/admin/queries/products/use-products.ts
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "@/actions/admin/products/get"

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const products = await getProducts();
      
      // DEBUG: Verificar estrutura real dos dados
      console.log('=== DADOS DA API getProducts() ===');
      console.log('Quantidade de produtos:', products?.length);
      if (products && products.length > 0) {
        console.log('Primeiro produto:', products[0]);
        console.log('Campos disponíveis:', Object.keys(products[0]));
      }
      
      return products;
    },
  })
}