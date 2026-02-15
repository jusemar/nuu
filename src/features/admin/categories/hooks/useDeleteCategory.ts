import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCategory } from '../services/categoryService'
import { categoryKeys } from './query-keys'
import { toast } from 'sonner'

type DeleteCategoryParams = {
  id: string
  type: 'soft' | 'hard'
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }: DeleteCategoryParams) => 
      deleteCategory(id, type),
    
    onSuccess: (_, variables) => {
      // Invalida a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      
      // Mostra toast de sucesso
      toast.success(
        variables.type === 'soft' 
          ? 'Categoria excluída com sucesso!'
          : 'Categoria excluída permanentemente!',
        {
          style: {
            backgroundColor: variables.type === 'soft' ? '#22c55e' : '#ef4444',
            color: '#ffffff',
          },
        }
      )
    },
    
    onError: (error) => {
      toast.error('Erro ao excluir categoria', {
        description: error.message,
      })
    },
  })
}