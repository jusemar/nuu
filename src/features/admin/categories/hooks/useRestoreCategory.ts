import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as categoryService  from '../services/categoryService'
import { categoryKeys } from './query-keys'
import { toast } from 'sonner'

export function useRestoreCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      console.log(`[useRestoreCategory.mutationFn] Iniciando restauração: ID=${id}`)
      try {
        const result = await categoryService.restoreCategory(id)
        console.log('[useRestoreCategory.mutationFn] Restauração completada com sucesso:', result)
        return result
      } catch (error) {
        console.error('[useRestoreCategory.mutationFn] Erro na mutação:', error)
        throw error
      }
    },
    
    onSuccess: (data, id) => {
      console.log('[useRestoreCategory.onSuccess] Restauração bem-sucedida para ID:', id)
      console.log('[useRestoreCategory.onSuccess] Invalidando queries...')
      
      // Invalida a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      
      // Mostra toast de sucesso
      const message = 'Categoria restaurada com sucesso!'
      console.log('[useRestoreCategory.onSuccess] Toast message:', message)
      toast.success(message, {
        style: {
          backgroundColor: '#22c55e',
          color: '#ffffff',
        },
      })
    },
    
    onError: (error) => {
      console.error('[useRestoreCategory.onError] Erro na mutação:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('[useRestoreCategory.onError] Mensagem:', errorMessage)
      toast.error(`Erro ao restaurar categoria: ${errorMessage}`, {
        style: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
        },
      })
    },
  })
}
