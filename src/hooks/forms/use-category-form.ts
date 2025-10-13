// src/hooks/forms/use-category-form.ts
"use client"

import { useState } from "react"

export function useCategoryForm() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    isActive: true,
  })

  const [isLoading, setIsLoading] = useState(false)

  const generateSlug = (name: string) => {
    setFormData(prev => ({
      ...prev,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'Nome é obrigatório'
    if (!formData.slug.trim()) return 'Slug é obrigatório'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        window.location.href = '/admin/categories'
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error) {
      alert('Erro ao salvar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    formData, 
    setFormData, 
    isLoading, 
    handleSubmit, 
    generateSlug 
  }
}