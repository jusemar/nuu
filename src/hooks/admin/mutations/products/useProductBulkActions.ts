"use client"

import { toast } from "sonner"
import { deleteProduct } from "@/actions/admin/products/delete"
import { useQueryClient } from "@tanstack/react-query"

export const useProductBulkActions = () => {
  const queryClient = useQueryClient()

  const handleDeleteSelected = async (selectedRows: any[]) => {
    const total = selectedRows.length
    if (total === 0) return

    // Limpar seleção
    const event = new CustomEvent("clearSelection")
    window.dispatchEvent(event)

    try {
      // Chamar a server action diretamente
      await Promise.all(selectedRows.map(row => deleteProduct(row.id)))
      
      // ✅ INVALIDAR CACHE para atualizar a lista
      await queryClient.refetchQueries({ queryKey: ['products'] })
      
      toast.success(`${total} produto(s) excluído(s) com sucesso!`, {
        style: {
          backgroundColor: "#22c55e",
          color: "#ffffff",
        },
      })
    } catch (error) {
      toast.error("Erro ao excluir produtos")
    }
  }

  return {
    handleDeleteSelected
  }
}