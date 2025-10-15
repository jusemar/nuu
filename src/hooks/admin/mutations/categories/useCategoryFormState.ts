"use client"

import { useState } from 'react'
import { useCreateCategory } from './useCategoryCRUD' // ← IMPORTAR

export const useCreateCategoryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    metaTitle: '',
    metaDescription: ''
  })

  const createCategoryMutation = useCreateCategory() // ← USAR O HOOK

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Chamar a mutation do TanStack Query ← CORREÇÃO AQUI
    createCategoryMutation.mutate(formData)
  }

  return {
    formData, 
    setFormData, 
    isLoading: createCategoryMutation.isPending, // ← CORRIGIDO
    handleSubmit,
    generateSlug 
  }
}