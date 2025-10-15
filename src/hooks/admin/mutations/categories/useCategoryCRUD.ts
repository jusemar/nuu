"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // ← IMPORT DO SONNER
import { createCategory } from "@/actions/admin/categories/create"

export const useCreateCategory = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: createCategory,
    
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message) // ← TOAST DE SUCESSO       
      } else {
        toast.error(result.message) // ← TOAST DE ERRO
      }
    },
    
    onError: (error) => {
      toast.error("Erro inesperado ao criar categoria") // ← TOAST DE ERRO
    }
  })
}