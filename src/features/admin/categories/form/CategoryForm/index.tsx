"use client"

import { ArrowLeft, Save, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BasicInfoCard } from "./BasicInfoCard"
import { SubcategoriesCard, SubcategoryItem } from "./SubcategoriesCard"
import { SidebarCards } from "./SidebarCards"
import { useSlugGenerator } from "./hooks/useSlugGenerator"
import { generateSubcategoryId } from "./utils/subcategory.helpers"
import { deleteSubcategoryWithDetails } from "./utils/deleteSubcategory"
import { updateSubcategoryName } from "./utils/updateSubcategory"
import { createChildSubcategory, calculateChildInsertPosition } from "./utils/createChildSubcategory"
import { useCreateCategory } from "../../hooks/useCreateCategory"
import { useUpdateCategory } from "../../hooks/useUpdateCategory" // ← Importar hook de edição

// =====================================================================
// PASSO 1: Definir as props que o componente pode receber
// =====================================================================
interface CategoryFormProps {
  initialData?: {
    id?: string
    name: string
    slug: string
    description?: string | null
    isActive?: boolean
    metaTitle?: string | null
    metaDescription?: string | null
    orderIndex?: number
  }
  isEditing?: boolean
}

// =====================================================================
// PASSO 2: Componente principal (agora recebendo props)
// =====================================================================
export function CategoryForm({ initialData, isEditing = false }: CategoryFormProps) {
  const router = useRouter()
  const { generateSlug } = useSlugGenerator()

  // Hooks para criar ou atualizar categoria
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory() // ← Hook de edição

  // =====================================================================
  // PASSO 3: Estado da categoria (agora usa initialData se existir)
  // =====================================================================
  const [categoryData, setCategoryData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    orderIndex: initialData?.orderIndex || 1
  })

  // Estado das subcategorias
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // =====================================================================
  // PASSO 4: Função para salvar (agora decide entre criar ou editar)
  // =====================================================================
  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      // Prepara os dados da categoria
      const categoryToSave = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || undefined,
        isActive: categoryData.isActive,
        metaTitle: categoryData.metaTitle || undefined,
        metaDescription: categoryData.metaDescription || undefined,
        orderIndex: categoryData.orderIndex
      }

      // Converte subcategorias para estrutura hierárquica
      const hierarchicalSubcategories = convertFlatToHierarchical(subcategories)

      const payloadToSend = {
        ...categoryToSave,
        subcategories: hierarchicalSubcategories
      }

      // Decide qual mutation usar
      if (isEditing && initialData?.id) {
        // Modo edição: chama updateCategory
        await updateCategoryMutation.mutateAsync({
          id: initialData.id,
          data: payloadToSend
        })
      } else {
        // Modo criação: chama createCategory
        await createCategoryMutation.mutateAsync(payloadToSend)
      }

      // Redireciona para a listagem após sucesso
      router.push('/admin/categories')
      
    } catch (err) {
      console.error('Erro ao salvar categoria:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================================
  // PASSO 5: Função para converter subcategorias (já existente)
  // =====================================================================
  const convertFlatToHierarchical = (subcats: SubcategoryItem[]) => {
    const build = (parentId: string | null) => {
      const levelChildren = subcats
        .filter(s => (parentId === null ? !s.parent : s.parent === parentId))
        .sort((a, b) => subcats.indexOf(a) - subcats.indexOf(b))

      return levelChildren.map((s, idx) => {
        const generatedSlug = s.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')

        const node: any = {
          name: s.name,
          slug: generatedSlug,
          level: s.level,
          parentId: parentId === null ? undefined : parentId,
          orderIndex: idx + 1,
          isActive: true,
        }

        const children = build(s.id)
        if (children.length > 0) node.children = children

        return node
      })
    }

    return build(null)
  }

  // =====================================================================
  // PASSO 6: Handlers de subcategoria (já existentes, mantidos iguais)
  // =====================================================================
  const handleAddSubcategory = (name: string) => {
    if (!name.trim()) return
    const newSubcategory: SubcategoryItem = {
      id: generateSubcategoryId(),
      name: name.trim(),
      level: 1,
      expanded: false,
      childrenCount: 0
    }
    setSubcategories(prev => [newSubcategory, ...prev])
    setExpandedItems(prev => [...prev, newSubcategory.id])
  }

  const handleDeleteSubcategory = (id: string) => {
    if (!window.confirm('Excluir esta subcategoria e todos os seus filhos?')) return
    const { newList, deletedIds } = deleteSubcategoryWithDetails(id, subcategories)
    setSubcategories(newList)
    setExpandedItems(prev => prev.filter(item => !deletedIds.includes(item)))
  }

  const handleEditSubcategory = (id: string, newName: string) => {
    try {
      const updatedList = updateSubcategoryName(id, newName, subcategories)
      setSubcategories(updatedList)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar')
    }
  }

  const handleAddChildSubcategory = (parentId: string, name: string) => {
    try {
      const newChild = createChildSubcategory(parentId, name, subcategories)
      const insertIndex = calculateChildInsertPosition(parentId, subcategories)
      const newList = [...subcategories]
      newList.splice(insertIndex, 0, newChild)
      setSubcategories(newList)
      if (!expandedItems.includes(parentId)) {
        setExpandedItems(prev => [...prev, parentId])
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar')
    }
  }

  const handleReorderSubcategories = (newOrder: SubcategoryItem[]) => {
    setSubcategories(newOrder)
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return "text-blue-600 bg-blue-50 border-blue-200"
      case 2: return "text-purple-600 bg-purple-50 border-purple-200"
      case 3: return "text-green-600 bg-green-50 border-green-200"
      case 4: return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const getLevelBadge = (level: number) => {
    const colors = {
      1: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      2: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
      3: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      4: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" }
    }
    const color = colors[level as keyof typeof colors] || colors[1]
    return (
      <Badge variant="outline" className={`${color.bg} ${color.text} ${color.border} text-xs`}>
        Nível {level}
      </Badge>
    )
  }

  const totalSubcategories = subcategories.length
  const directSubcategories = subcategories.filter(s => s.level === 1).length
  const maxLevel = Math.max(...subcategories.map(s => s.level), 0)

  // =====================================================================
  // PASSO 7: Renderização (agora com título dinâmico)
  // =====================================================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/categories')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Link href="/admin" className="hover:text-gray-700">Admin</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/admin/categories" className="hover:text-gray-700">Categorias</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium">
                  {isEditing ? categoryData.name : 'Nova'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              categoryData.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {categoryData.isActive ? '● Ativa' : '● Rascunho'}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/categories')}>
              Cancelar
            </Button>
            <Button 
              size="sm"
              onClick={handleSubmit}
              disabled={isLoading || !categoryData.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Layout (igual ao anterior) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda */}
        <div className="lg:col-span-4 space-y-6">
          <BasicInfoCard
            data={categoryData}
            onDataChange={(updates) => {
              if (updates.name !== undefined) {
                const generatedSlug = generateSlug(updates.name)
                updates = { ...updates, slug: generatedSlug }
              }
              setCategoryData(prev => ({ ...prev, ...updates }))
            }}
            onSlugChange={() => {}}
            isLoading={isLoading}
            metaTitleCount={categoryData.metaTitle.length}
            metaDescCount={categoryData.metaDescription.length}
            ProgressBar={({ value, max = 100 }) => {
              const percentage = Math.min((value / max) * 100, 100)
              return (
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )
            }}
          />
        </div>

        {/* Coluna central */}
        <div className="lg:col-span-5 space-y-6">
          <SubcategoriesCard
            subcategories={subcategories}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            getLevelColor={getLevelColor}
            getLevelBadge={getLevelBadge}
            categoryName={categoryData.name}
            directSubcategories={directSubcategories}
            totalSubcategories={totalSubcategories}
            onAddSubcategory={handleAddSubcategory}
            onDeleteSubcategory={handleDeleteSubcategory}
            onEditSubcategory={handleEditSubcategory}
            onAddChildSubcategory={handleAddChildSubcategory}
            onReorderSubcategories={handleReorderSubcategories}
          />
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-3 space-y-6">
          <SidebarCards
            categoryData={categoryData}
            setCategoryData={setCategoryData}
            subcategories={subcategories}
            totalSubcategories={totalSubcategories}
            maxLevel={maxLevel}
          />
        </div>
      </div>
    </div>
  )
}