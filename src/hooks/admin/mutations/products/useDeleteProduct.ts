"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteProduct } from "@/actions/admin/products/delete"

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (result) => {
      if (result.success) {   
        queryClient.refetchQueries({ queryKey: ['products'] })
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      toast.error("Erro inesperado ao deletar produto")
    }
  })
}