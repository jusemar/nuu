"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteCategories } from "@/actions/admin/categories/delete-categories"

export const useDeleteCategories = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await deleteCategories(ids)
      return result
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message, {
          style: {
            backgroundColor: "#22c55e",
            color: "#ffffff",
          },
        })
        queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      } else {
        toast.error(result.message)
      }
    },
    onError: () => {
      toast.error("Erro ao deletar categorias")
    }
  })
}