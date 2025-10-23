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
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  createdAt: Date; // ← Mude para Date
  updatedAt: Date; // ← Mude para Date
}

export default function CategoriesPage() {
  const router = useRouter()
  const { data: categories, isLoading } = useCategories()
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

  const hasChanges = JSON.stringify(localCategories) !== JSON.stringify(originalCategories)

  const updateLocalCategory = (id: string, field: string, value: any) => {
    setLocalCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    )
  }

const saveChanges = () => {
  // Encontrar apenas as categorias que foram modificadas
  const modifiedCategories = localCategories.filter((category, index) => {
    return JSON.stringify(category) !== JSON.stringify(originalCategories[index])
  })

  // Atualizar apenas as modificadas
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

  setOriginalCategories(localCategories)
  
  // UM toast único
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

  // Exclui todos de uma vez (pode manter o delay se quiser, mas não é necessário)
  await Promise.all(selectedRows.map(row => deleteCategory(row.id)))

  // Mensagem única de sucesso
  toast.success(`${total} categoria(s) excluída(s) com sucesso!`, {
    style: {
      backgroundColor: "#22c55e",
      color: "#ffffff",
    },
  })

  // Limpa seleção dos checkboxes
  setTimeout(() => {
    // Encontra o DataTable e limpa seleção via evento customizado
    const event = new CustomEvent("clearSelection")
    window.dispatchEvent(event)
  }, 100)
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
        const date = new Date(row.getValue("updatedAt"))
        return <span className="text-sm text-gray-600">{date.toLocaleDateString('pt-BR')}</span>
      }
    }
  ]

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (    
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            {localCategories.length} categoria(s)
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button onClick={saveChanges} variant="default">
                💾 Salvar
              </Button>
              <Button onClick={cancelChanges} variant="outline">
                ↩️ Cancelar
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Link>
          </Button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={localCategories}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  )
}