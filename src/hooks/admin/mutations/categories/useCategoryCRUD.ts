"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Import do Sonner
import { createCategory } from "@/actions/admin/categories/create"

export const useCreateCategory = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: createCategory,
    
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Categoria criada com sucesso!", {
          style: {
            backgroundColor: "#22c55e", // Cor verde do Tailwind (bg-green-500)
            color: "#ffffff", // Texto branco
          },
        });
      } else {
        toast.error(result.message);
      }
    },
    
    onError: (error) => {
      toast.error("Erro inesperado ao criar categoria");
    }
  })
}