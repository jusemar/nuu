"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteCategory } from "@/actions/admin/categories/delete"

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (result) => {
      if (result.success) {   
        queryClient.refetchQueries({ queryKey: ['categories'] })
      } else {
        toast.error(result.message)
      }
    },
    onError: (error) => {
      toast.error("Erro inesperado ao deletar categoria")
    }
  })
}