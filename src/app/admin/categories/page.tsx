"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { EditableCell } from "@/components/admin/editable-cell"
import { EditableSwitch } from "@/components/admin/editable-switch"
import { useCategories } from "@/hooks/admin/queries/use-categories"
import { useUpdateCategory } from "@/hooks/admin/mutations/categories/useUpdateCategory"
import { useDeleteCategory } from "@/hooks/admin/mutations/categories/useDeleteCategory"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CategoryTreeTable } from '@/features/admin/categories/components/CategoryTreeTable'

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CategoriesPage() {
  const router = useRouter()
  const { data: categories, isLoading, refetch } = useCategories()
  const { mutate: updateCategory } = useUpdateCategory()
  const { mutate: deleteCategory } = useDeleteCategory()
  const [localCategories, setLocalCategories] = useState<Category[]>([])
  const [originalCategories, setOriginalCategories] = useState<Category[]>([])

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories)
      setOriginalCategories(categories)
    }
  }, [categories])

  const hasChanges = useMemo(() => {
    if (localCategories.length !== originalCategories.length) return true;
    
    return localCategories.some((category, index) => {
      const original = originalCategories[index];
      if (!original) return true;
      
      return category.name !== original.name ||
             category.slug !== original.slug ||
             category.description !== original.description ||
             category.metaTitle !== original.metaTitle ||
             category.metaDescription !== original.metaDescription ||
             category.isActive !== original.isActive;
    });
  }, [localCategories, originalCategories]);

  const updateLocalCategory = (id: string, field: string, value: any) => {
    setLocalCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    )
  }

const saveChanges = () => {
  const modifiedCategories = localCategories.filter((category, index) => {
    return JSON.stringify(category) !== JSON.stringify(originalCategories[index])
  })

  modifiedCategories.forEach(category => {
    updateCategory({
      id: category.id,
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        isActive: category.isActive
      }
    })
  })

  // Atualiza o estado local primeiro
  setOriginalCategories(localCategories)
  
  // Depois faz o refetch
  setTimeout(() => {
    refetch()
  }, 200)

  toast.success(`${modifiedCategories.length} categoria(s) atualizada(s) com sucesso!`, {
    style: {
      backgroundColor: "#22c55e",
      color: "#ffffff",
    },
  })
}
  const cancelChanges = () => {
    setLocalCategories(originalCategories)
  }

  const handleDeleteSelected = async (selectedRows: Category[]) => {
  const total = selectedRows.length

  // Primeiro limpa a seleção
  const event = new CustomEvent("clearSelection")
  window.dispatchEvent(event)

  // Exclui as categorias
  await Promise.all(selectedRows.map(row => deleteCategory(row.id)))

  // Faz refetch após um pequeno delay
  setTimeout(() => {
    refetch()
  }, 200)

  toast.success(`${total} categoria(s) excluída(s) com sucesso!`, {
    style: {
      backgroundColor: "#22c55e",
      color: "#ffffff",
    },
  })
}

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: any }) => (
        <EditableCell
          value={row.getValue("name") || ""}
          onBlur={(newValue) => updateLocalCategory(row.original.id, "name", newValue)}
        />
      )
    },
    {
      accessorKey: "slug", 
      header: "Slug",
      cell: ({ row }: { row: any }) => (
        <EditableCell
          value={row.getValue("slug") || ""}
          onBlur={(newValue) => updateLocalCategory(row.original.id, "slug", newValue)}
        />
      )
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }: { row: any }) => (
        <EditableCell
          value={row.getValue("description") || ""}
          onBlur={(newValue) => updateLocalCategory(row.original.id, "description", newValue)}
        />
      )
    },
    {
      accessorKey: "metaTitle",
      header: "Meta Título",
      cell: ({ row }: { row: any }) => (
        <EditableCell
          value={row.getValue("metaTitle") || ""}
          onBlur={(newValue) => updateLocalCategory(row.original.id, "metaTitle", newValue)}
        />
      )
    },
    {
      accessorKey: "metaDescription",
      header: "Meta Descrição",
      cell: ({ row }: { row: any }) => (
        <EditableCell
          value={row.getValue("metaDescription") || ""}
          onBlur={(newValue) => updateLocalCategory(row.original.id, "metaDescription", newValue)}
        />
      )
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <EditableSwitch
          value={row.getValue("isActive")}
          onSave={(newValue) => updateLocalCategory(row.original.id, "isActive", newValue)}
        />
      )
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.getValue("createdAt"))
        return <span className="text-sm text-gray-600">{date.toLocaleDateString('pt-BR')}</span>
      }
    },
    {
      accessorKey: "updatedAt",
      header: "Última Atualização", 
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.getValue("updatedAt"));
        return <span className="text-sm text-gray-600">
          {date.toLocaleDateString('pt-BR')} {date.getHours()-3}:{date.getMinutes().toString().padStart(2, '0')}
        </span>
      }
    }
  ]

  if (isLoading) {
    return <div>Carregando...</div>
  }
   

  // SUBSTITUA APENAS O RETURN (a partir da linha "return (")
return (    
  <div className="space-y-8 p-6">
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
          <p className="text-gray-500 mt-1">
            {localCategories.length} categoria(s) cadastrada(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasChanges && (
            <>
              <Button 
                onClick={saveChanges} 
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                💾 Salvar Alterações
              </Button>
              <Button 
                onClick={cancelChanges} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                ↩️ Descartar
              </Button>
            </>
          )}
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/categories/new">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Link>
          </Button>
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <DataTable 
        columns={columns} 
        data={localCategories}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  </div>
)

}