import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '@/actions/admin/products/create'

interface UseCreateProductOptions {
  onSuccess?: () => void
}

export function useCreateProduct(options?: UseCreateProductOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      options?.onSuccess?.()
    },
  })
}