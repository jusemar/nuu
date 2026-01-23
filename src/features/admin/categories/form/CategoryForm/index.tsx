"use client"

import { ArrowLeft, Save, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCategoryFormState } from "@/hooks/admin/mutations/categories/useCategoryFormState"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BasicInfoCard } from "./BasicInfoCard"
import { SubcategoriesCard, SubcategoryItem } from "./SubcategoriesCard"
import { SidebarCards } from "./SidebarCards"
import { Badge } from "@/components/ui/badge"

export function CategoryForm() {
  const router = useRouter()
  const { 
    formData: originalFormData,  
    setFormData: originalSetFormData, 
    isLoading, 
    handleSubmit,
    handleNameChange
  } = useCategoryFormState()

  // Estado local para visualização
  const [categoryData, setCategoryData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    orderIndex: 1
  })

  // Dados simples para subcategorias
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([
    { id: "1", name: "Por Material", level: 1, childrenCount: 2, expanded: true },
    { id: "2", name: "Molas", level: 2, parent: "1", childrenCount: 1, expanded: true },
    { id: "3", name: "Pocket Spring", level: 3, parent: "2" },
    { id: "4", name: "Espuma", level: 2, parent: "1" },
    { id: "5", name: "Por Tamanho", level: 1, childrenCount: 2 },
    { id: "6", name: "Solteiro", level: 2, parent: "5" },
    { id: "7", name: "Queen", level: 2, parent: "5" },
  ])

  const [expandedItems, setExpandedItems] = useState<string[]>(["1", "2"])
  const [metaTitleCount, setMetaTitleCount] = useState(0)
  const [metaDescCount, setMetaDescCount] = useState(0)

  // Sincronizar dados do hook com estado local
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

  // Contadores de caracteres para meta tags
  useEffect(() => {
    setMetaTitleCount(categoryData.metaTitle.length)
    setMetaDescCount(categoryData.metaDescription.length)
  }, [categoryData.metaTitle, categoryData.metaDescription])

  // Função para expandir/recolher itens da árvore
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // Função para obter cor baseada no nível
  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return "text-blue-600 bg-blue-50 border-blue-200"
      case 2: return "text-purple-600 bg-purple-50 border-purple-200"
      case 3: return "text-gray-600 bg-gray-50 border-gray-200"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  // Função para criar badge do nível
  const getLevelBadge = (level: number) => {
    const colors = {
      1: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      2: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
      3: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" }
    }
    const color = colors[level as keyof typeof colors] || colors[3]
    
    return (
      <Badge variant="outline" className={`${color.bg} ${color.text} ${color.border} text-xs`}>
        Nível {level}
      </Badge>
    )
  }

  // Calcular estatísticas para a sidebar
  const totalSubcategories = subcategories.length
  const directSubcategories = subcategories.filter(s => s.level === 1).length
  const maxLevel = Math.max(...subcategories.map(s => s.level))

  // Componente Progress Bar (pode ser movido para utils depois)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header com breadcrumb e ações */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/categories')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {categoryData.name ? `Editar: ${categoryData.name}` : "Nova Categoria"}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Link href="/admin" className="hover:text-gray-700">Admin</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/admin/categories" className="hover:text-gray-700">Categorias</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium">{categoryData.name ? "Editar" : "Nova"}</span>
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
        
        {/* COLUNA ESQUERDA (33%) - Informações Básicas e SEO */}
        <div className="lg:col-span-4 space-y-6">
          <BasicInfoCard
             data={categoryData}
            setCategoryData={setCategoryData}
            originalSetFormData={originalSetFormData}
            handleNameChange={handleNameChange}
            isLoading={isLoading}
            metaTitleCount={metaTitleCount}
            metaDescCount={metaDescCount}
            ProgressBar={ProgressBar}
          />
        </div>

        {/* COLUNA CENTRAL (42%) - Gerenciador de Subcategorias */}
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
          />
        </div>

        {/* COLUNA DIREITA (25%) - Ações, Estrutura e Estatísticas */}
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