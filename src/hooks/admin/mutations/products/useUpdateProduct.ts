"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateProduct } from "@/actions/admin/products/update"

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  function obterMensagemErro(error: unknown) {
    if (error instanceof Error) return error.message
    if (typeof error === "string") return error
    return ""
  }

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
      const mensagem = obterMensagemErro(error).toLowerCase()
      const actionDesalinhada =
        mensagem.includes("failed to find server action") ||
        mensagem.includes("older or newer deployment")

      if (actionDesalinhada) {
        toast.error("Sessão desatualizada. Recarregando a página para sincronizar.")
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload()
        }, 300)
        return
      }

      toast.error("Erro inesperado ao atualizar produto")
    }
  })
}
