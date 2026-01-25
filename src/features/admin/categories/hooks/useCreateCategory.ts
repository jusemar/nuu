/**
 * Hook específico para criação de categorias
 * 
 * Responsabilidades:
 * - Mutação para criar nova categoria
 * - Otimistic updates
 * - Invalidation de queries relacionadas
 * - Tratamento de erro específico
 * - Rollback em caso de falha
 * 
 * Features:
 * - Success/Error callbacks
 * - Auto-redirect após criação
 * - Form state management
 * - Validação pré-submissão
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { categoryService } from '../services/categoryService'
import { 
  Category, 
  CreateCategoryRequest,
  CategoryFormState 
} from '../types'
import { categoryKeys, categoryDetailKeys } from './useCategoryList'

/**
 * Configuração para toasts (Sonner)
 */
const toastConfig = {
  success: {
    title: 'Categoria criada',
    description: 'A categoria foi criada com sucesso',
    duration: 5000
  },
  error: {
    title: 'Erro ao criar',
    description: 'Não foi possível criar a categoria',
    duration: 10000
  },
  loading: {
    title: 'Criando categoria...',
    description: 'Por favor, aguarde',
    duration: Infinity
  }
}

/**
 * Validação do formulário antes de enviar
 */
function validateCategoryForm(data: CategoryFormState): string[] {
  const errors: string[] = []
  
  if (!data.name.trim()) {
    errors.push('Nome da categoria é obrigatório')
  }
  
  if (data.name.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres')
  }
  
  if (data.name.length > 100) {
    errors.push('Nome não pode exceder 100 caracteres')
  }
  
  if (!data.slug.trim()) {
    errors.push('Slug é obrigatório')
  }
  
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug deve conter apenas letras minúsculas, números e hífens')
  }
  
  if (data.metaTitle && data.metaTitle.length > 60) {
    errors.push('Meta título não pode exceder 60 caracteres')
  }
  
  if (data.metaDescription && data.metaDescription.length > 160) {
    errors.push('Meta descrição não pode exceder 160 caracteres')
  }
  
  return errors
}

/**
 * Hook principal para criação de categoria
 */
export function useCreateCategory(
  options?: UseMutationOptions<Category, Error, CreateCategoryRequest>
) {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation<Category, Error, CreateCategoryRequest>({
    mutationFn: async (categoryData) => {
      // Validação antes de enviar ao servidor
      const errors = validateCategoryForm(categoryData as CategoryFormState)
      if (errors.length > 0) {
        throw new Error(errors.join(', '))
      }
      
      // Adiciona userId (do auth) e defaults
      const dataToSend = {
        ...categoryData,
        userId: 'current-user-id', // TODO: Pegar do auth context
        orderIndex: categoryData.orderIndex || 1,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true
      }
      
      return await categoryService.createCategory(dataToSend)
    },
    
    // Otimistic update: atualiza cache antes da resposta do servidor
    onMutate: async (newCategory) => {
      // Cancela queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      
      // Snapshot do estado anterior para rollback
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists())
      
      // Cria categoria otimista (com ID temporário)
      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`,
        name: newCategory.name,
        slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        description: newCategory.description || null,
        isActive: newCategory.isActive !== undefined ? newCategory.isActive : true,
        metaTitle: newCategory.metaTitle || null,
        metaDescription: newCategory.metaDescription || null,
        orderIndex: newCategory.orderIndex || 1,
        userId: 'current-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Atualiza cache com a nova categoria
      queryClient.setQueryData<Category[]>(
        categoryKeys.lists(),
        old => old ? [optimisticCategory, ...old] : [optimisticCategory]
      )
      
      // Retorna contexto para rollback se necessário
      return { previousCategories }
    },
    
    // Em caso de sucesso
    onSuccess: (createdCategory, variables, context) => {
      // Invalida queries para forçar refetch com dados corretos
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryDetailKeys.all })
      
      // Atualiza cache com dados reais (substitui o otimista)
      queryClient.setQueryData<Category[]>(
        categoryKeys.lists(),
        old => old?.map(cat => 
          cat.id.startsWith('temp-') ? createdCategory : cat
        )
      )
      
      // Adiciona ao cache individual
      queryClient.setQueryData(
        categoryDetailKeys.byId(createdCategory.id),
        createdCategory
      )
      
      // Toast de sucesso
      toast.success(toastConfig.success.title, {
        description: toastConfig.success.description,
        duration: toastConfig.success.duration,
        action: {
          label: 'Ver',
          onClick: () => router.push(`/admin/categories/${createdCategory.id}`)
        }
      })
      
      // Chama callback personalizado se fornecido
      options?.onSuccess?.(createdCategory, variables, context)
    },
    
    // Em caso de erro
    onError: (error, variables, context) => {
      // Rollback: restaura estado anterior
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), context.previousCategories)
      }
      
      // Toast de erro
      toast.error(toastConfig.error.title, {
        description: error.message || toastConfig.error.description,
        duration: toastConfig.error.duration
      })
      
      // Chama callback personalizado se fornecido
      options?.onError?.(error, variables, context)
    },
    
    // Sempre executa (sucesso ou erro)
    onSettled: (data, error, variables, context) => {
      // Garante que o cache está consistente
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      
      // Chama callback personalizado se fornecido
      options?.onSettled?.(data, error, variables, context)
    },
    
    // Configurações adicionais
    retry: 1, // Tenta mais uma vez em caso de falha
    retryDelay: 1000, // 1 segundo entre tentativas
  })
}

/**
 * Hook para criação de categoria com redirecionamento automático
 */
export function useCreateCategoryWithRedirect(
  redirectTo?: string,
  options?: UseMutationOptions<Category, Error, CreateCategoryRequest>
) {
  const router = useRouter()
  const createMutation = useCreateCategory({
    ...options,
    onSuccess: (data, variables, context) => {
      // Redireciona após criação bem-sucedida
      if (redirectTo) {
        router.push(redirectTo.replace(':id', data.id))
      } else {
        router.push(`/admin/categories/${data.id}`)
      }
      
      // Chama callback original se existir
      options?.onSuccess?.(data, variables, context)
    }
  })
  
  return createMutation
}

/**
 * Hook para criação com confirmação (modal/dialog)
 */
export function useCreateCategoryWithConfirmation(
  options?: UseMutationOptions<Category, Error, CreateCategoryRequest>
) {
  const createMutation = useCreateCategory(options)
  
  const createWithConfirmation = (
    data: CreateCategoryRequest,
    confirmationMessage = 'Tem certeza que deseja criar esta categoria?'
  ) => {
    if (window.confirm(confirmationMessage)) {
      return createMutation.mutateAsync(data)
    }
    return Promise.reject(new Error('Criação cancelada pelo usuário'))
  }
  
  return {
    ...createMutation,
    mutateAsyncWithConfirmation: createWithConfirmation
  }
}

/**
 * Hook para criação em lote (múltiplas categorias)
 */
export function useBatchCreateCategories(
  options?: UseMutationOptions<Category[], Error, CreateCategoryRequest[]>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Category[], Error, CreateCategoryRequest[]>({
    mutationFn: async (categoriesData) => {
      const createdCategories: Category[] = []
      
      for (const data of categoriesData) {
        try {
          const category = await categoryService.createCategory({
            ...data,
            userId: 'current-user-id',
            orderIndex: data.orderIndex || 1,
            isActive: data.isActive !== undefined ? data.isActive : true
          })
          createdCategories.push(category)
        } catch (error) {
          console.error('Erro ao criar categoria em lote:', error)
          // Continua com as próximas mesmo se uma falhar
        }
      }
      
      return createdCategories
    },
    
    onMutate: async (categories) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())
      
      const optimisticCategories = categories.map((cat, index) => ({
        id: `temp-batch-${Date.now()}-${index}`,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || null,
        isActive: cat.isActive !== undefined ? cat.isActive : true,
        metaTitle: cat.metaTitle || null,
        metaDescription: cat.metaDescription || null,
        orderIndex: cat.orderIndex || 1,
        userId: 'current-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      queryClient.setQueryData<Category[]>(
        categoryKeys.lists(),
        old => old ? [...optimisticCategories, ...old] : optimisticCategories
      )
      
      return { previous }
    },
    
    onSuccess: (createdCategories) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      
      toast.success(`${createdCategories.length} categorias criadas`, {
        duration: 5000
      })
    },
    
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
      
      toast.error('Erro ao criar categorias em lote', {
        description: error.message,
        duration: 10000
      })
    }
  })
}

/**
 * Hook utilitário para validação em tempo real enquanto digita
 */
export function useCategoryFormValidation() {
  const [errors, setErrors] = useState<string[]>([])
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const validateField = (field: keyof CategoryFormState, value: any) => {
    const formState = { [field]: value } as any
    const fieldErrors = validateCategoryForm(formState)
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }))
  }
  
  const handleBlur = (field: keyof CategoryFormState) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }
  
  const getFieldError = (field: keyof CategoryFormState) => {
    return touched[field] ? errors[field] : null
  }
  
  const validateAll = (formData: CategoryFormState) => {
    const allErrors = validateCategoryForm(formData)
    setErrors(allErrors)
    setTouched(Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {}))
    
    return allErrors.length === 0
  }
  
  return {
    errors,
    touched,
    validateField,
    handleBlur,
    getFieldError,
    validateAll,
    isValid: errors.length === 0,
    isTouched: Object.values(touched).some(Boolean)
  }
}

import { useState } from 'react'