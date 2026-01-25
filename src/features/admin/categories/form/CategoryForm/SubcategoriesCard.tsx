"use client"

import { Folder, Home, Plus, ChevronRight, GripVertical, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SortableSubcategoryNode } from "./SortableSubcategoryNode"
import { DropZone } from "./DropZone" // ← NOVO IMPORT
import { canCreateSubcategory } from "./utils/subcategory.helpers"
import { useState } from "react"
import { useSubcategoryDnD } from "./hooks/useSubcategoryDnD"
import { 
  SortableContext, 
  verticalListSortingStrategy,
  closestCorners // ← IMPORT ALTERADO
} from '@dnd-kit/sortable'
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core'

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
  onAddChildSubcategory: (parentId: string, name: string) => void
  onReorderSubcategories: (newOrder: SubcategoryItem[]) => void
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
  onEditSubcategory,
  onAddChildSubcategory,
  onReorderSubcategories
}: SubcategoriesCardProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")

  // Configuração do drag-and-drop
  const {
    activeId,
    sensors,
    handleDragStart,
    handleDragOver, // ← RECEBENDO handleDragOver
    handleDragEnd,
    dropAnimation,
    measuringConfig
  } = useSubcategoryDnD(subcategories, onReorderSubcategories)

  // IDs das subcategorias de nível 1 (para o SortableContext)
  const rootSubcategoryIds = subcategories
    .filter(item => !item.parent)
    .map(item => item.id)

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

  // 🔽🔽🔽 FUNÇÃO PARA RENDERIZAR DROP ZONES 🔽🔽🔽
  const renderDropZones = (items: SubcategoryItem[]) => {
    const dropZones: React.ReactNode[] = []
    
    // Drop zone no início da lista (nível 1)
    dropZones.push(
      <DropZone
        key="dropzone-start"
        id="dropzone-start"
        parentId={undefined}
        index={0}
        position="before"
        isActive={!!activeId}
      />
    )
    
    // Drop zones entre cada item de nível 1
    items.forEach((item, index) => {
      dropZones.push(
        <div key={`item-${item.id}`}>
          {/* Drop zone antes do item */}
          <DropZone
            key={`dropzone-before-${item.id}`}
            id={`dropzone-before-${item.id}`}
            parentId={item.parent}
            index={index}
            position="before"
            isActive={!!activeId}
          />
          
          {/* Item renderizado */}
          <SortableSubcategoryNode
            item={item}
            subcategories={subcategories}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            getLevelColor={getLevelColor}
            getLevelBadge={getLevelBadge}
            onDeleteSubcategory={onDeleteSubcategory}
            onEditSubcategory={onEditSubcategory}
            onAddChildSubcategory={onAddChildSubcategory}
            activeDragId={activeId}
          />
          
          {/* Drop zone depois do item */}
          <DropZone
            key={`dropzone-after-${item.id}`}
            id={`dropzone-after-${item.id}`}
            parentId={item.parent}
            index={index + 1}
            position="after"
            isActive={!!activeId}
          />
        </div>
      )
    })
    
    return dropZones
  }
  // 🔼🔼🔼 FIM DA FUNÇÃO DE DROP ZONES 🔼🔼🔼

  // Item sendo arrastado (para o overlay)
  const activeItem = activeId 
    ? subcategories.find(item => item.id === activeId)
    : null

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

        {/* Contexto drag-and-drop */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver} // ← ADICIONADO
          onDragEnd={handleDragEnd}
          collisionDetection={closestCorners} // ← ALTERADO
          measuring={measuringConfig}
        >
          {/* Área sortable para subcategorias de nível 1 */}
          <SortableContext 
            items={rootSubcategoryIds}
            strategy={verticalListSortingStrategy}
          >
            {/* 🔽🔽🔽 ÁRVORE COM DROP ZONES 🔽🔽🔽 */}
            <div className="space-y-1">
              {renderDropZones(subcategories.filter(item => !item.parent))}
            </div>
            {/* 🔼🔼🔼 FIM DA ÁRVORE COM DROP ZONES 🔼🔼🔼 */}
          </SortableContext>

          {/* Overlay do item sendo arrastado */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem && (
              <div className="opacity-80 shadow-lg">
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${getLevelColor(activeItem.level)} bg-white`}>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <Folder className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 font-medium truncate">{activeItem.name}</span>
                  {getLevelBadge(activeItem.level)}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

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