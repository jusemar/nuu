import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '@/actions/admin/products/create'

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidar queries de produtos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}