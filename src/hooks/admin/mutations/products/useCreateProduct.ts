import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '@/actions/admin/products/create'
import { toast } from "sonner"

interface UseCreateProductOptions {
  onSuccess?: () => void
  /**
   * Quando `false`, o hook não exibe o aviso de sucesso.
   * Serve para telas que precisam informar o resultado real do cadastro
   * (publicado x salvo como rascunho) em uma única mensagem.
   */
  mostrarAvisoDeSucesso?: boolean
}

export function useCreateProduct(options?: UseCreateProductOptions) {
  const queryClient = useQueryClient()
  const mostrarAvisoDeSucesso = options?.mostrarAvisoDeSucesso ?? true

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['products'] })

        if (mostrarAvisoDeSucesso) {
          // ✅ SUCESSO - Verde
          toast.success("Produto criado com sucesso!", {
            style: {
              backgroundColor: "#22c55e", // Verde
              color: "#ffffff",
              border: "1px solid #16a34a",
            },
          });
        }

        options?.onSuccess?.()
      } else {
        // ❌ ERRO DA API - Vermelho
        toast.error(result.error || "Erro ao criar produto", {
          style: {
            backgroundColor: "#dc2626", // Vermelho
            color: "#ffffff", 
            border: "1px solid #b91c1c",
          },
        });
      }
    },
    onError: (error) => {
      // ❌ ERRO INESPERADO - Vermelho escuro
      toast.error("Erro inesperado ao criar produto", {
        style: {
          backgroundColor: "#991b1b", // Vermelho escuro
          color: "#ffffff",
          border: "1px solid #7f1d1d",
        },
      });
    }
  })
}