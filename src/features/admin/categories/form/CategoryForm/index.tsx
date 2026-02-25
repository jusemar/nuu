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

export function CategoryForm() {
  const router = useRouter()
  const { generateSlug } = useSlugGenerator()

  // Hook para criar categoria
  const createCategoryMutation = useCreateCategory()

  // Estado da categoria
  const [categoryData, setCategoryData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    orderIndex: 1
  })

  // Estado das subcategorias (INICIALMENTE VAZIO)
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Função para salvar TUDO
  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      // 1. Cria a categoria principal
      const categoryToCreate = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || undefined,
        isActive: categoryData.isActive,
        metaTitle: categoryData.metaTitle || undefined,
        metaDescription: categoryData.metaDescription || undefined,
        orderIndex: categoryData.orderIndex
      }

      // Converte a lista plana de subcategorias do UI para a estrutura hierárquica
      // esperada pelo serviço. A função gera slug, preserva ordem entre irmãos e
      // aninha `children` recursivamente.
      const hierarchicalSubcategories = convertFlatToHierarchical(subcategories)

  // === LOG PARA DEBUG ===
  // Exibe no console o payload que será enviado ao servidor. Remova estes
  // logs depois que confirmar o comportamento correto.
  const payloadToSend = {
    ...categoryToCreate,
    subcategories: hierarchicalSubcategories
  }
 

  // Envia a requisição ao servidor e loga a resposta
  let createdCategory
  try {
    createdCategory = await createCategoryMutation.mutateAsync(payloadToSend)
   
  } catch (err) {
   
    throw err
  }

  // Informação adicional para ajudar no diagnóstico
  if (!hierarchicalSubcategories || hierarchicalSubcategories.length === 0) {
   
  } else {
    
  }      
      alert('Erro ao salvar categoria. Verifique o console.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para converter subcategorias da UI para API
  const convertSubcategoriesToApiFormat = (
    subcats: SubcategoryItem[], 
    categoryId: string, 
    parentId: string | null = null
  ) => {
    const requests: any[] = []
    
    const levelSubcats = subcats.filter(sub => 
      parentId === null ? !sub.parent : sub.parent === parentId
    )
    
    const sorted = [...levelSubcats].sort((a, b) => {
      const indexA = subcats.indexOf(a)
      const indexB = subcats.indexOf(b)
      return indexA - indexB
    })
    
    sorted.forEach((subcat, index) => {
      const generatedSlug = subcat.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')

      requests.push({
        name: subcat.name,
        slug: generatedSlug,
        level: subcat.level,
        parentId: parentId,
        categoryId: categoryId,
        orderIndex: index + 1,
        isActive: true
      })
      
      // Processa filhos
      const children = subcats.filter(child => child.parent === subcat.id)
      if (children.length > 0) {
        const childRequests = convertSubcategoriesToApiFormat(subcats, categoryId, subcat.id)
        requests.push(...childRequests)
      }
    })
    
    return requests
  }

  // === NOVA FUNÇÃO: converte lista plana do UI para estrutura hierárquica ===
  // Produz objetos compatíveis com `HierarchicalSubcategory`:
  // { name, slug, level, parentId?, orderIndex, isActive, children? }
  const convertFlatToHierarchical = (subcats: SubcategoryItem[]) => {
    // Função recursiva que monta nós a partir de um parentId
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

  // Funções existentes do seu código (mantidas)
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
              disabled={isLoading || !categoryData.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Layout */}
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