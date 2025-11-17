"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateProduct } from "@/actions/admin/products/update"

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: (result) => {
      if (result.success) {   
        queryClient.refetchQueries({ queryKey: ['products'] })
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      toast.error("Erro inesperado ao atualizar produto")
    }
  })
}