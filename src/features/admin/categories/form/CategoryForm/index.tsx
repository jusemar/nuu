"use client"

import { ArrowLeft, Save, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useCategoryFormState } from "@/hooks/admin/mutations/categories/useCategoryFormState"
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

export function CategoryForm() {
  const router = useRouter()
  const { 
    formData: originalFormData,  
    setFormData: originalSetFormData, 
    isLoading, 
    handleSubmit,
    handleNameChange
  } = useCategoryFormState()

  const { generateSlug } = useSlugGenerator()

  // Estado local para dados da categoria
  const [categoryData, setCategoryData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    orderIndex: 1
  })

  // Estado para subcategorias (dados de exemplo)
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([
    { id: "1", name: "Por Material", level: 1, childrenCount: 2, expanded: true },
    { id: "2", name: "Molas", level: 2, parent: "1", childrenCount: 1, expanded: true },
    { id: "3", name: "Pocket Spring", level: 3, parent: "2" },
    { id: "4", name: "Espuma", level: 2, parent: "1" },
    { id: "5", name: "Por Tamanho", level: 1, childrenCount: 2 },
    { id: "6", name: "Solteiro", level: 2, parent: "5" },
    { id: "7", name: "Queen", level: 2, parent: "5" },
  ])

  // Estado para controlar itens expandidos na árvore
  const [expandedItems, setExpandedItems] = useState<string[]>(["1", "2"])
  
  // Contadores para meta tags (SEO)
  const [metaTitleCount, setMetaTitleCount] = useState(0)
  const [metaDescCount, setMetaDescCount] = useState(0)

  // ========== FUNÇÕES DE SUBCATEGORIAS ==========

  /**
   * Adiciona uma nova subcategoria de nível 1
   */
  const handleAddSubcategory = (name: string) => {
    if (!name || name.trim() === '') return

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

  /**
   * Remove uma subcategoria e todos os seus filhos
   */
  const handleDeleteSubcategory = (id: string) => {
    if (!window.confirm('Excluir esta subcategoria e todos os seus filhos?')) {
      return
    }

    const { newList, deletedIds } = deleteSubcategoryWithDetails(id, subcategories)
    setSubcategories(newList)
    setExpandedItems(prev => prev.filter(item => !deletedIds.includes(item)))
  }

  /**
* Atualiza o nome de uma subcategoria existente */
const handleEditSubcategory = (id: string, newName: string) => {
  try {
    const updatedList = updateSubcategoryName(id, newName, subcategories)
    setSubcategories(updatedList)
  } catch (error) {
    // Mostra erro para o usuário (pode ser toast/notification depois)
    alert(error instanceof Error ? error.message : 'Erro ao atualizar subcategoria')
  }
}

/**
 * Adiciona uma subcategoria filha a uma subcategoria existente
 */
const handleAddChildSubcategory = (parentId: string, name: string) => {
  try {
    // Cria o objeto da nova subcategoria filha
    const newChild = createChildSubcategory(parentId, name, subcategories)
    
    // Calcula onde inserir (logo após o pai, antes dos outros filhos)
    const insertIndex = calculateChildInsertPosition(parentId, subcategories)
    
    // Insere na posição correta
    const newList = [...subcategories]
    newList.splice(insertIndex, 0, newChild)

    
    // Atualiza estado
    setSubcategories(newList)
    
    // Expande o pai automaticamente para mostrar o novo filho
    if (!expandedItems.includes(parentId)) {
      setExpandedItems(prev => [...prev, parentId])
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar subcategoria filha'
    alert(errorMessage)
  }
}


const handleReorderSubcategories = (newOrder: SubcategoryItem[]) => {
  setSubcategories(newOrder)
}

  /**
   * Expande ou recolhe um item da árvore
   */
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // ========== FUNÇÕES AUXILIARES ==========

  /**
   * Retorna classes de cor baseadas no nível
   */
  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return "text-blue-600 bg-blue-50 border-blue-200"
      case 2: return "text-purple-600 bg-purple-50 border-purple-200"
      case 3: return "text-green-600 bg-green-50 border-green-200"
      case 4: return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  /**
   * Cria um badge colorido para indicar o nível
   */
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

  // ========== USE EFFECTS ==========

  // Sincroniza dados do hook com estado local
  useEffect(() => {
    setCategoryData(prev => ({
      ...prev,
      name: originalFormData.name,
      slug: originalFormData.slug,
      description: originalFormData.description || "",
      isActive: originalFormData.isActive,
      metaTitle: originalFormData.metaTitle || "",
      metaDescription: originalFormData.metaDescription || ""
    }))
  }, [originalFormData])

  // Atualiza contadores de caracteres
  useEffect(() => {
    setMetaTitleCount(categoryData.metaTitle.length)
    setMetaDescCount(categoryData.metaDescription.length)
  }, [categoryData.metaTitle, categoryData.metaDescription])

  // ========== CÁLCULOS ==========

  const totalSubcategories = subcategories.length
  const directSubcategories = subcategories.filter(s => s.level === 1).length
  const maxLevel = Math.max(...subcategories.map(s => s.level))

  // ========== COMPONENTES AUXILIARES ==========

  /**
   * Barra de progresso para contadores de SEO
   */
  const ProgressBar = ({ value, max = 100 }: { value: number; max?: number }) => {
    const percentage = Math.min((value / max) * 100, 100)
    return (
      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Cabeçalho com breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/categories')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Categoria</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Link href="/admin" className="hover:text-gray-700">Admin</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/admin/categories" className="hover:text-gray-700">Categorias</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium">Nova</span>
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
            <Button variant="outline" size="sm">Cancelar</Button>
            <Button 
              size="sm"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Layout de 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coluna esquerda: Informações básicas (33%) */}
        <div className="lg:col-span-4 space-y-6">
          <BasicInfoCard
            data={categoryData}
            onDataChange={(updates) => {
              if (updates.name !== undefined) {
                const generatedSlug = generateSlug(updates.name)
                updates = { ...updates, slug: generatedSlug }
              }
              
              setCategoryData(prev => ({ ...prev, ...updates }))
              originalSetFormData((prev: any) => ({ ...prev, ...updates }))
            }}
            onSlugChange={(slug) => {}}
            isLoading={isLoading}
            metaTitleCount={metaTitleCount}
            metaDescCount={metaDescCount}
            ProgressBar={ProgressBar}
          />
        </div>

        {/* Coluna central: Subcategorias (42%) */}
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

        {/* Coluna direita: Estatísticas (25%) */}
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