// src/hooks/admin/mutations/use-update-category.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateCategory } from "@/data/categories/update"

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => 
      updateCategory(id, data),
    
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      
      const previousCategories = queryClient.getQueryData(['admin', 'categories'])
      
      // Atualização otimista
      queryClient.setQueryData(['admin', 'categories'], (old: any) => 
        old?.map((cat: any) => 
          cat.id === id ? { ...cat, ...data } : cat
        ) || []
      )
      
      return { previousCategories }
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin', 'categories'], context?.previousCategories)
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    }
  })
}