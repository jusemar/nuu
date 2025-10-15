import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateCategory } from "@/actions/admin/categories/update"

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => 
      updateCategory(id, data),    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    }
  })
}