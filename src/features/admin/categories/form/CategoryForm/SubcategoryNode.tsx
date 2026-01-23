"use client"

import { ChevronRight, ChevronDown, GripVertical, Folder, Edit, Plus, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // ← NOVO IMPORT
import { Badge } from "@/components/ui/badge"
import { SubcategoryItem } from "./SubcategoriesCard"
import { useState } from "react" // ← NOVO IMPORT

interface SubcategoryNodeProps {
  item: SubcategoryItem
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
  onDeleteSubcategory: (id: string) => void
  onEditSubcategory: (id: string, newName: string) => void // ← NOVA PROP
}

export function SubcategoryNode({ 
  item, 
  subcategories, 
  expandedItems, 
  toggleExpand, 
  getLevelColor, 
  getLevelBadge,
  onDeleteSubcategory,
  onEditSubcategory // ← RECEBER
}: SubcategoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false) // ← ESTADO DE EDIÇÃO
  const [editName, setEditName] = useState(item.name) // ← NOME EM EDIÇÃO

  const children = subcategories.filter(child => child.parent === item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  
  const indent = item.level === 1 ? "ml-0" : item.level === 2 ? "ml-6" : "ml-12"
  const connector = item.level > 1 ? (
    <div className={`absolute left-0 top-0 bottom-0 w-4 border-l border-b border-gray-300`}></div>
  ) : null

  // 🔽🔽🔽 FUNÇÕES DE EDIÇÃO 🔽🔽🔽
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
  // 🔼🔼🔼 FIM DAS FUNÇÕES DE EDIÇÃO 🔼🔼🔼

  const handleDelete = () => {
    onDeleteSubcategory(item.id)
  }

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
        
        {/* 🔽🔽🔽 CONTEÚDO CONDICIONAL: TEXTO OU INPUT 🔽🔽🔽 */}
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
        {/* 🔼🔼🔼 FIM DO CONTEÚDO CONDICIONAL 🔼🔼🔼 */}
        
        <div className="flex items-center gap-2">
          {getLevelBadge(item.level)}
          
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {children.length}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 🔽🔽🔽 BOTÃO EDITAR (AGORA FUNCIONAL) 🔽🔽🔽 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-blue-500 hover:text-blue-700"
              onClick={handleStartEdit}
              title="Editar nome"
              disabled={isEditing}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            {/* Botão Adicionar Filho (ainda não implementado) */}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3 w-3" />
            </Button>
            
            {/* Botão Excluir */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Excluir esta subcategoria e todos os seus filhos"
              disabled={isEditing}
            >
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
              onDeleteSubcategory={onDeleteSubcategory}
              onEditSubcategory={onEditSubcategory} // ← PASSANDO PARA FILHOS
            />
          ))}
        </div>
      )}
    </div>
  )
}