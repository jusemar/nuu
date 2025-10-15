"use client"

import { useState } from 'react'
import { useCreateCategory } from '@/hooks/admin/mutations/categories/useCategoryCRUD'
import { useSlugGenerator } from '@/hooks/forms/useSlugGenerator'

export const useCategoryFormState = () => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    metaTitle: '',
    metaDescription: ''
  })

  const createCategoryMutation = useCreateCategory()
   const { generateSlug } = useSlugGenerator() 

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name,
      slug: generateSlug(name) // ← GERA SLUG AUTOMATICAMENTE
    }))
  }

  // Função para limpar o formulário
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      metaTitle: '',
      metaDescription: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    createCategoryMutation.mutate(formData, {
      onSuccess: (result) => {
        if (result.success) {
          resetForm() // ← LIMPA O FORMULÁRIO APÓS SUCESSO
        }
      }
    })
  }

  return {
    formData, 
    setFormData, 
    isLoading: createCategoryMutation.isPending,
    handleSubmit,
    generateSlug,
    handleNameChange,
    resetForm // ← EXPORTA A FUNÇÃO TAMBÉM
  }
}