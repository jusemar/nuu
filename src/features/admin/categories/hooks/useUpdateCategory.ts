/**
 * Hook para atualizar categoria existente
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { categoryService } from '../services/categoryService'
import { Category, CreateCategoryInput } from '../types'
import { categoryKeys } from './useCategoryList'

/**
 * Hook para atualizar uma categoria
 */
export function useUpdateCategory(
  options?: UseMutationOptions<Category, Error, { id: string; data: CreateCategoryInput }>
) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<Category, Error, { id: string; data: CreateCategoryInput }>({
    mutationFn: async ({ id, data }) => {
      console.log('[useUpdateCategory] 📊 Iniciando mutation update para ID:', id)
      // Chama o serviço (vamos criar o método updateCategory no service)
      return await categoryService.updateCategory(id, data)
    },

    onSuccess: (updatedCategory, variables) => {
      console.log('[useUpdateCategory] ✅ Sucesso na atualização para ID:', variables.id)
      // Invalida queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['category-detail', 'by-id', variables.id] })

      // Toast de sucesso em VERDE
      toast.success('Alteração de categoria com Sucesso', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#ffffff'
        }
      })

      // Redireciona para a lista
      setTimeout(() => {
        console.log('[useUpdateCategory] ➡️ Redirecionando para lista de categorias')
        router.push('/admin/categories')
      }, 500)

      // Callback personalizado
      options?.onSuccess?.(updatedCategory, variables, undefined as any)
    },

    onError: (error) => {
      console.error('[useUpdateCategory] ❌ Erro na atualização:', error.message)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error('Erro ao atualizar categoria', {
        description: errorMessage,
      })
    },
  })
}
