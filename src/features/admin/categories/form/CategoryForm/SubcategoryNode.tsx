"use client"

import { ChevronRight, ChevronDown, GripVertical, Folder, Edit, Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SubcategoryItem } from "./SubcategoriesCard"
import { useState } from "react"

interface SubcategoryNodeProps {
  item: SubcategoryItem
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
  onDeleteSubcategory: (id: string) => void
  onEditSubcategory: (id: string, newName: string) => void
  onAddChildSubcategory: (parentId: string, name: string) => void
  // 🔽🔽🔽 NOVAS PROPS PARA DRAG-AND-DROP 🔽🔽🔽
  dragAttributes?: any
  dragListeners?: any
  isDragging?: boolean
}

export function SubcategoryNode({ 
  item, 
  subcategories, 
  expandedItems, 
  toggleExpand, 
  getLevelColor, 
  getLevelBadge,
  onDeleteSubcategory,
  onEditSubcategory,
  onAddChildSubcategory,
  // 🔽🔽🔽 RECEBENDO PROPS DE DRAG 🔽🔽🔽
  dragAttributes,
  dragListeners,
  isDragging = false
}: SubcategoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildName, setNewChildName] = useState("")

  const children = subcategories.filter(child => child.parent === item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  
  const indent = item.level === 1 ? "ml-0" : item.level === 2 ? "ml-6" : "ml-12"
  const connector = item.level > 1 ? (
    <div className={`absolute left-0 top-0 bottom-0 w-4 border-l border-b border-gray-300`}></div>
  ) : null

  // 🔽🔽🔽 ÍCONE DE ARRASTE CONECTADO AO DND 🔽🔽🔽
  const DragHandle = () => (
    <GripVertical 
      className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600"
      {...dragAttributes}
      {...dragListeners}
    />
  )

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditName(item.name)
  }

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== item.name) {
      onEditSubcategory(item.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(item.name)
  }

  const handleStartAddChild = () => {
    setIsAddingChild(true)
    setNewChildName("")
    if (!isExpanded) {
      toggleExpand(item.id)
    }
  }

  const handleSaveChild = () => {
    if (newChildName.trim()) {
      onAddChildSubcategory(item.id, newChildName.trim())
      setIsAddingChild(false)
      setNewChildName("")
    }
  }

  const handleCancelAddChild = () => {
    setIsAddingChild(false)
    setNewChildName("")
  }

  const handleDelete = () => {
    onDeleteSubcategory(item.id)
  }

  return (
    <div className={`relative ${indent} ${isDragging ? 'opacity-50' : ''}`}>
      {connector}
      
      {/* ITEM PRINCIPAL */}
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
        
        {/* ÍCONE DE ARRASTE CONECTADO */}
        <DragHandle />
        
        <Folder className="h-4 w-4 flex-shrink-0" />
        
        {/* CONTEÚDO CONDICIONAL */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-500 hover:text-green-700"
              onClick={handleSaveEdit}
              title="Salvar"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700"
              onClick={handleCancelEdit}
              title="Cancelar"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="flex-1 font-medium truncate">{item.name}</span>
        )}
        
        <div className="flex items-center gap-2">
          {getLevelBadge(item.level)}
          
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {children.length}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* BOTÃO EDITAR */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-blue-500 hover:text-blue-700"
              onClick={handleStartEdit}
              title="Editar nome"
              disabled={isEditing || isAddingChild || isDragging}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            {/* BOTÃO ADICIONAR FILHO */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-green-500 hover:text-green-700"
              onClick={handleStartAddChild}
              title="Adicionar subcategoria filha"
              disabled={isEditing || isAddingChild || isDragging || item.level >= 4}
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            {/* BOTÃO EXCLUIR */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Excluir esta subcategoria e todos os seus filhos"
              disabled={isEditing || isAddingChild || isDragging}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* INPUT PARA ADICIONAR FILHO */}
      {isAddingChild && (
        <div className="ml-10 mb-2 mt-1 p-2 border border-dashed border-gray-300 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-500"
              onClick={handleCancelAddChild}
              title="Cancelar"
            >
              <X className="h-3 w-3" />
            </Button>
            
            <Input
              autoFocus
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder={`Digite o nome da subcategoria filha de "${item.name}"...`}
              className="flex-1 h-8 text-sm border-gray-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChildName.trim()) {
                  handleSaveChild()
                }
                if (e.key === 'Escape') {
                  handleCancelAddChild()
                }
              }}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-green-500"
              disabled={!newChildName.trim()}
              onClick={handleSaveChild}
              title="Salvar"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1 ml-9">
            Criando como nível {item.level + 1} • Pressione <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> para salvar
          </p>
        </div>
      )}
      
     
     
    </div>
  )
}