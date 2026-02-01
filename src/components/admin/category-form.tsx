"use client"

import { ArrowLeft, Save, Folder, Home, Upload, Eye, Calendar, AlertCircle, GripVertical, Plus, Edit, Trash2, ChevronRight, ChevronDown, Link as LinkIcon, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { useCategoryFormState } from "@/hooks/admin/mutations/categories/useCategoryFormState"
import { useRouter } from "next/navigation"
import { revalidateCategories } from "@/actions/admin/shared/revalidate"
import { useState, useEffect } from "react"

// Tipos mais simples para evitar erros
type SubcategoryItem = {
  id: string
  name: string
  level: number
  parent?: string
  childrenCount?: number
  expanded?: boolean
}

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

  // Dados simples para subcategorias (vazio para novo formulário)
  // Nota: Havia dados de exemplo aqui (usados em protótipos). Removemos
  // para que a tela de "Nova Categoria" inicie sempre vazia.
  // Caso queira dados de exemplo para desenvolvimento, use a constante
  // EXAMPLE_SUBCATEGORIES abaixo (descomentando quando necessário).
  //
  // const EXAMPLE_SUBCATEGORIES: SubcategoryItem[] = [
  //   { id: "1", name: "Por Material", level: 1, childrenCount: 2, expanded: true },
  //   { id: "2", name: "Molas", level: 2, parent: "1", childrenCount: 1, expanded: true },
  //   { id: "3", name: "Pocket Spring", level: 3, parent: "2" },
  // ]
  
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([])

  // Nenhuma subcategoria expandida por padrão em novo formulário
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [metaTitleCount, setMetaTitleCount] = useState(0)
  const [metaDescCount, setMetaDescCount] = useState(0)

  // Sincronizar dados
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

  // Contadores de caracteres
  useEffect(() => {
    setMetaTitleCount(categoryData.metaTitle.length)
    setMetaDescCount(categoryData.metaDescription.length)
  }, [categoryData.metaTitle, categoryData.metaDescription])

  // Funções auxiliares
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
      case 3: return "text-gray-600 bg-gray-50 border-gray-200"
      default: return "text-gray-600 bg-gray-50"
    }
  }

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

  // Calcular estatísticas
  const totalSubcategories = subcategories.length
  const directSubcategories = subcategories.filter(s => s.level === 1).length
  const maxLevel = Math.max(...subcategories.map(s => s.level))

  // Componente Progress Bar customizado
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
      {/* Header */}
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

      {/* Layout 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA (25%) - Informações Básicas */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Nome da Categoria *</Label>
                <Input
                  id="name"
                  value={categoryData.name}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryData(prev => ({ ...prev, name: value }))
                    handleNameChange(value)
                  }}
                  placeholder="Ex: Colchões"
                  className="text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="font-medium">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="slug"
                      value={categoryData.slug}
                      onChange={(e) => {
                        const value = e.target.value
                        setCategoryData(prev => ({ ...prev, slug: value }))
                        originalSetFormData((prev: any) => ({ ...prev, slug: value }))
                      }}
                      placeholder="colchoes"
                    />
                  </div>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Preview: <span className="font-mono">/categorias/{categoryData.slug || 'nome'}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={categoryData.description}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryData(prev => ({ ...prev, description: value }))
                    originalSetFormData((prev: any) => ({ ...prev, description: value }))
                  }}
                  placeholder="Descreva esta categoria..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagem da Categoria</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Clique para upload</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="isActive" className="font-medium">Status</Label>
                <Switch
                  id="isActive"
                  checked={categoryData.isActive}
                  onCheckedChange={(checked) => {
                    setCategoryData(prev => ({ ...prev, isActive: checked }))
                    originalSetFormData((prev: any) => ({ ...prev, isActive: checked }))
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">SEO & Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaTitle">Meta Título</Label>
                  <span className="text-xs text-gray-500">{metaTitleCount}/60</span>
                </div>
                <Input
                  id="metaTitle"
                  value={categoryData.metaTitle}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryData(prev => ({ ...prev, metaTitle: value }))
                    originalSetFormData((prev: any) => ({ ...prev, metaTitle: value }))
                  }}
                  placeholder="Compre Colchões de Qualidade"
                  maxLength={60}
                />
                <ProgressBar value={metaTitleCount} max={60} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaDescription">Meta Descrição</Label>
                  <span className="text-xs text-gray-500">{metaDescCount}/160</span>
                </div>
                <Textarea
                  id="metaDescription"
                  value={categoryData.metaDescription}
                  onChange={(e) => {
                    const value = e.target.value
                    setCategoryData(prev => ({ ...prev, metaDescription: value }))
                    originalSetFormData((prev: any) => ({ ...prev, metaDescription: value }))
                  }}
                  placeholder="Encontre os melhores colchões com garantia..."
                  rows={2}
                  maxLength={160}
                />
                <ProgressBar value={metaDescCount} max={160} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA CENTRAL (50%) - Subcategorias */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Gerenciador de Subcategorias
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal">
                      {directSubcategories} subcategorias diretas
                    </Badge>
                    <span className="text-gray-400">•</span>
                    <span>{totalSubcategories} no total</span>
                    <span className="text-gray-400">•</span>
                    <span>Máximo 4 níveis</span>
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Subcategoria
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">
                <Home className="h-3 w-3" />
                <span>Home</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium">{categoryData.name || "Categoria"}</span>
                <ChevronRight className="h-3 w-3" />
                <span>Subcategorias</span>
              </div>

              {/* Árvore de Subcategorias */}
              <div className="space-y-1">
                {subcategories
                  .filter(item => !item.parent)
                  .map(item => (
                    <div key={item.id}>
                      <SubcategoryNode
                        item={item}
                        subcategories={subcategories}
                        expandedItems={expandedItems}
                        toggleExpand={toggleExpand}
                        getLevelColor={getLevelColor}
                        getLevelBadge={getLevelBadge}
                      />
                    </div>
                  ))}
              </div>

              {subcategories.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-700 mb-2">Nenhuma subcategoria</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Adicione subcategorias para organizar seus produtos
                  </p>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira subcategoria
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Nível 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Nível 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Nível 3</span>
            </div>
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span>Arrastar para reordenar</span>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (25%) - Ações & Status */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Publicação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={categoryData.isActive ? "default" : "secondary"}>
                    {categoryData.isActive ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Visibilidade</span>
                  <span className="text-sm font-medium">Pública</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Criado em</span>
                  <span className="text-sm font-medium">Hoje</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Button className="w-full">
                  Publicar Agora
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-gray-600">
                  Salvar como rascunho
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card Estrutura */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estrutura da Hierarquia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="font-mono text-sm bg-gray-50 p-3 rounded border">
                  {categoryData.name || "Categoria"}<br/>
                  {subcategories.filter(s => s.level === 1).map((item, i) => (
                    <div key={item.id} className="ml-2">
                      ├─ {item.name}<br/>
                      {subcategories
                        .filter(s => s.parent === item.id)
                        .map(child => (
                          <div key={child.id} className="ml-4">
                            │  └─ {child.name}<br/>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-3 w-3" />
                    <span>Preview da navegação</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Estatísticas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Produtos vinculados</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Subcategorias total</span>
                  <span className="font-medium">{totalSubcategories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Níveis de profundidade</span>
                  <span className="font-medium">{maxLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ordem de exibição</span>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={categoryData.orderIndex}
                    onChange={(e) => setCategoryData(prev => ({ 
                      ...prev, 
                      orderIndex: parseInt(e.target.value) || 1 
                    }))}
                    className="w-16 h-8 text-center"
                  />
                </div>
              </div>
              
              {maxLevel >= 4 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Máximo de 4 níveis atingido</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Componente de nó da árvore
function SubcategoryNode({ 
  item, 
  subcategories, 
  expandedItems, 
  toggleExpand, 
  getLevelColor, 
  getLevelBadge 
}: {
  item: SubcategoryItem
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
}) {
  const children = subcategories.filter(child => child.parent === item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  
  const indent = item.level === 1 ? "ml-0" : item.level === 2 ? "ml-6" : "ml-12"
  const connector = item.level > 1 ? (
    <div className={`absolute left-0 top-0 bottom-0 w-4 border-l border-b border-gray-300`}></div>
  ) : null

  return (
    <div className={`relative ${indent}`}>
      {connector}
      
      <div className={`flex items-center gap-2 p-3 mb-1 rounded-lg border ${getLevelColor(item.level)} group hover:shadow-sm transition-all`}>
        <button 
          onClick={() => toggleExpand(item.id)}
          className="text-gray-500 hover:text-gray-700"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4 h-4"></div>
          )}
        </button>
        
        <GripVertical className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" />
        
        <Folder className="h-4 w-4 flex-shrink-0" />
        
        <span className="flex-1 font-medium truncate">{item.name}</span>
        
        <div className="flex items-center gap-2">
          {getLevelBadge(item.level)}
          
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {children.length}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-6">
          {children.map(child => (
            <SubcategoryNode
              key={child.id}
              item={child}
              subcategories={subcategories}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              getLevelColor={getLevelColor}
              getLevelBadge={getLevelBadge}
            />
          ))}
        </div>
      )}
    </div>
  )
}