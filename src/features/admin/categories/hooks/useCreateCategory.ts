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
  CreateCategoryInput,
} from '../types'
import { categoryKeys } from './useCategoryList'
import { useState } from 'react'

// Tipo local para validação do formulário
type CategoryFormState = {
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  orderIndex?: number
}

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
  options?: UseMutationOptions<Category, Error, CreateCategoryInput>
) {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation<Category, Error, CreateCategoryInput, { previousCategories?: Category[] }>({
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
        orderIndex: (categoryData as any).orderIndex || 1,
        isActive: (categoryData as any).isActive !== undefined ? (categoryData as any).isActive : true
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
      // Atualiza cache com dados reais (substitui o otimista)
      queryClient.setQueryData<Category[]>(
        categoryKeys.lists(),
        old => old?.map(cat => 
          cat.id.startsWith('temp-') ? createdCategory : cat
        )
      )
      
      // Adiciona ao cache individual (detail)
      queryClient.setQueryData(
        categoryKeys.detail(createdCategory.id),
        createdCategory
      )
      
      // Toast de sucesso em VERDE
      toast.success(toastConfig.success.title, {
        description: toastConfig.success.description,
        duration: toastConfig.success.duration,
        style: {
          background: '#10b981',
          color: '#ffffff'
        }
      })
      
      // Redireciona para a lista de categorias
      router.push('/admin/categories')
      
      // Chama callback personalizado se fornecido
      options?.onSuccess?.(createdCategory, variables, context)
    },
    
    // Em caso de erro
    onError: (error, variables, context) => {
      // Rollback: restaura estado anterior
      if ((context as any)?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), (context as any).previousCategories)
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
  options?: UseMutationOptions<Category, Error, CreateCategoryInput>
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
  options?: UseMutationOptions<Category, Error, CreateCategoryInput>
) {
  const createMutation = useCreateCategory(options)
  
  const createWithConfirmation = (
    data: CreateCategoryInput,
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
  options?: UseMutationOptions<Category[], Error, CreateCategoryInput[]>
) {
  const queryClient = useQueryClient()
  
  return useMutation<Category[], Error, CreateCategoryInput[], { previous?: Category[] }>({
    mutationFn: async (categoriesData) => {
      const createdCategories: Category[] = []
      
      for (const data of categoriesData) {
        try {
          const category = await categoryService.createCategory({
            ...data,
            userId: 'current-user-id',
            orderIndex: (data as any).orderIndex || 1,
            isActive: (data as any).isActive !== undefined ? (data as any).isActive : true
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
        slug: (cat as any).slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: (cat as any).description || null,
        isActive: (cat as any).isActive !== undefined ? (cat as any).isActive : true,
        metaTitle: (cat as any).metaTitle || null,
        metaDescription: (cat as any).metaDescription || null,
        orderIndex: (cat as any).orderIndex || 1,
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
      if ((context as any)?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), (context as any).previous)
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
  // errors: map [fieldName] -> array de mensagens
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const validateField = (field: keyof CategoryFormState, value: any) => {
    const formState = { [field]: value } as any
    const fieldErrors = validateCategoryForm(formState as CategoryFormState)
    setErrors(prev => ({
      ...prev,
      [String(field)]: fieldErrors
    }))
  }
  
  const handleBlur = (field: keyof CategoryFormState) => {
    setTouched(prev => ({ ...prev, [String(field)]: true }))
  }
  
  const getFieldError = (field: keyof CategoryFormState) => {
    return touched[String(field)] ? errors[String(field)] ?? null : null
  }
  
  const validateAll = (formData: CategoryFormState) => {
    const allErrors = validateCategoryForm(formData)
    // Quando validateCategoryForm retorna array global, coloca em key '_all' para compatibilidade
    setErrors({ _all: allErrors })
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
    isValid: (errors._all ? errors._all.length === 0 : Object.keys(errors).length === 0),
    isTouched: Object.values(touched).some(Boolean)
  }
}