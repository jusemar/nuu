'use client'

import { useParams } from 'next/navigation'
import { useCategoryDetail } from '../hooks/useCategoryDetail'
import { CategoryForm } from '../form/CategoryForm'
import { Loader2 } from 'lucide-react'

export default function EditCategoryPage() {
  const params = useParams()
  const categoryId = params.id as string

  console.log('[EditCategoryPage] 🚀 Montado com categoryId:', categoryId)

  const { data: category, isLoading, error } = useCategoryDetail(categoryId)

  console.log('[EditCategoryPage] 📊 Estado:', { isLoading, hasCategory: !!category, hasError: !!error })
  if (error) {
    console.log('[EditCategoryPage] ❌ Erro:', error.message)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Carregando categoria...</p>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-red-600">
          <p className="text-sm font-medium">Erro ao carregar categoria</p>
          <p className="text-xs text-red-500">
            {error?.message || 'Categoria não encontrada'}
          </p>
        </div>
      </div>
    )
  }

  const formInitialData = {
    id: category.id,
    name: category.name,
    slug: category.slug || '',
    description: category.description || '',
    isActive: category.isActive !== false,
    metaTitle: category.metaTitle || '',
    metaDescription: category.metaDescription || '',
    orderIndex: category.orderIndex,
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Editar Categoria</h1>
        <p className="text-sm text-slate-500">Altere os dados da categoria</p>
      </div>

      <CategoryForm 
        initialData={formInitialData}
        isEditing={true}
      />
    </div>
  )
}