import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCategoryServer } from '../services/categoryService.server'
import { categoryKeys } from './query-keys'
import { toast } from 'sonner'

type DeleteCategoryParams = {
  id: string
  type: 'soft' | 'hard'
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, type }: DeleteCategoryParams) => {
      console.log(`[useDeleteCategory.mutationFn] Iniciando mutação: ID=${id}, type=${type}`)
      try {
        const result = await deleteCategoryServer(id, type)
        console.log('[useDeleteCategory.mutationFn] Mutação completada:', result)
        if (!result.success) {
          throw new Error(result.message)
        }
        return result
      } catch (error) {
        console.error('[useDeleteCategory.mutationFn] Erro na mutação:', error)
        throw error
      }
    },
    
    onSuccess: (data, variables) => {
      console.log('[useDeleteCategory.onSuccess] Delete bem-sucedido para ID:', variables.id)
      console.log('[useDeleteCategory.onSuccess] Invalidando queries...')
      
      // Invalida a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      
      // Mostra toast de sucesso
      const message = variables.type === 'soft' 
        ? 'Categoria marcada como inativa com sucesso!'
        : 'Categoria excluída permanentemente!'
      
      console.log('[useDeleteCategory.onSuccess] Toast message:', message)
      toast.success(message, {
        style: {
          backgroundColor: variables.type === 'soft' ? '#22c55e' : '#ef4444',
          color: '#ffffff',
        },
      })
    },
    
    onError: (error) => {
      console.error('[useDeleteCategory.onError] Erro na mutação:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('[useDeleteCategory.onError] Mensagem:', errorMessage)
      
      toast.error('Erro ao excluir categoria', {
        description: errorMessage,
      })
    },
  })
}