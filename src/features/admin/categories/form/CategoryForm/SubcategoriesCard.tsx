"use client"

import { Folder, Home, Plus, ChevronRight, GripVertical, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubcategoryNode } from "./SubcategoryNode"
import { canCreateSubcategory } from "./utils/subcategory.helpers"
import { useState } from "react"

export type SubcategoryItem = {
  id: string
  name: string
  level: number
  parent?: string
  childrenCount?: number
  expanded?: boolean
}

interface SubcategoriesCardProps {
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
  categoryName: string
  directSubcategories: number
  totalSubcategories: number
  onAddSubcategory: (name: string) => void
  onDeleteSubcategory: (id: string) => void 
  onEditSubcategory: (id: string, newName: string) => void
}

export function SubcategoriesCard({
  subcategories,
  expandedItems,
  toggleExpand,
  getLevelColor,
  getLevelBadge,
  categoryName,
  directSubcategories,
  totalSubcategories,
  onAddSubcategory,
  onDeleteSubcategory,
   onEditSubcategory 
}: SubcategoriesCardProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")

  const canCreate = canCreateSubcategory(categoryName)

  const handleSaveNewSubcategory = () => {
    if (!newSubcategoryName.trim()) return
    onAddSubcategory(newSubcategoryName.trim())
    setNewSubcategoryName("")
    setIsCreatingNew(false)
  }

  const handleCancelCreation = () => {
    setIsCreatingNew(false)
    setNewSubcategoryName("")
  }

  return (
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
          <Button 
            size="sm"
            disabled={!canCreate || isCreatingNew}
            title={!canCreate ? "Digite o nome da categoria primeiro" : ""}
            onClick={() => setIsCreatingNew(true)}
          >
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
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            <span className={`font-medium ${!categoryName ? "text-gray-400" : ""}`}>
              {categoryName || "—"}
            </span>
          </div>
          <span className="text-gray-400 mx-1">•</span>
          <span className="text-xs">
            {directSubcategories} diretas • {totalSubcategories} total
          </span>
        </div>

        {/* Input para nova subcategoria */}
        {isCreatingNew && (
          <div className="mb-4 p-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                onClick={handleCancelCreation}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <Input
                autoFocus
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Digite o nome da subcategoria..."
                className="flex-1 border-blue-300 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubcategoryName.trim()) {
                    handleSaveNewSubcategory()
                  }
                  if (e.key === 'Escape') {
                    handleCancelCreation()
                  }
                }}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-green-500 hover:bg-green-50"
                disabled={!newSubcategoryName.trim()}
                onClick={handleSaveNewSubcategory}
                title="Salvar"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2 ml-10">
              Pressione <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> para salvar • 
              <kbd className="px-1 py-0.5 bg-gray-200 rounded mx-1">Esc</kbd> para cancelar
            </p>
          </div>
        )}

        {!canCreate && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
            ⚠️ Digite o nome da categoria na coluna esquerda antes de adicionar subcategorias.
          </div>
        )}

        {/* Árvore de subcategorias */}
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
                  onDeleteSubcategory={onDeleteSubcategory} 
                 onEditSubcategory={onEditSubcategory}
                />
              </div>
            ))}
        </div>

        {/* Mensagem de lista vazia */}
        {subcategories.length === 0 && !isCreatingNew && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">Nenhuma subcategoria</h3>
            <p className="text-sm text-gray-500 mb-4">
              {canCreate 
                ? "Adicione subcategorias para organizar seus produtos" 
                : "Digite o nome da categoria primeiro"}
            </p>
            <Button 
              size="sm"
              disabled={!canCreate}
              title={!canCreate ? "Digite o nome da categoria primeiro" : ""}
              onClick={() => setIsCreatingNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira subcategoria
            </Button>
          </div>
        )}

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Nível 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Nível 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Nível 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Nível 4</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span>Arrastar para reordenar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}