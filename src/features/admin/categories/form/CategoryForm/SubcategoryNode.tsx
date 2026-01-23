"use client"

import { ChevronRight, ChevronDown, GripVertical, Folder, Edit, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SubcategoryItem } from "./SubcategoriesCard"

// Props que o componente recebe
interface SubcategoryNodeProps {
  item: SubcategoryItem
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
}

export function SubcategoryNode({ 
  item, 
  subcategories, 
  expandedItems, 
  toggleExpand, 
  getLevelColor, 
  getLevelBadge 
}: SubcategoryNodeProps) {
  // Filtra os filhos deste item (subcategorias que têm este item como pai)
  const children = subcategories.filter(child => child.parent === item.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  
  // Define a indentação baseada no nível
  const indent = item.level === 1 ? "ml-0" : item.level === 2 ? "ml-6" : "ml-12"
  
  // Cria o conector visual para itens de nível > 1
  const connector = item.level > 1 ? (
    <div className={`absolute left-0 top-0 bottom-0 w-4 border-l border-b border-gray-300`}></div>
  ) : null

  return (
    <div className={`relative ${indent}`}>
      {/* Linha conectora para hierarquia visual */}
      {connector}
      
      {/* Container principal do item */}
      <div className={`flex items-center gap-2 p-3 mb-1 rounded-lg border ${getLevelColor(item.level)} group hover:shadow-sm transition-all`}>
        {/* Botão para expandir/recolher (só aparece se tiver filhos) */}
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
            <div className="w-4 h-4"></div> // Espaço reservado para alinhamento
          )}
        </button>
        
        {/* Ícone para arrastar (reordenar) */}
        <GripVertical className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" />
        
        {/* Ícone de pasta */}
        <Folder className="h-4 w-4 flex-shrink-0" />
        
        {/* Nome da subcategoria */}
        <span className="flex-1 font-medium truncate">{item.name}</span>
        
        {/* Ações e badges do lado direito */}
        <div className="flex items-center gap-2">
          {/* Badge do nível (Nível 1, Nível 2, etc.) */}
          {getLevelBadge(item.level)}
          
          {/* Badge com contagem de filhos (só aparece se tiver filhos) */}
          {hasChildren && (
            <Badge variant="secondary" className="text-xs">
              {children.length}
            </Badge>
          )}
          
          {/* Botões de ação (aparecem só ao passar o mouse) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Botão Editar */}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit className="h-3 w-3" />
            </Button>
            {/* Botão Adicionar Filho */}
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3 w-3" />
            </Button>
            {/* Botão Excluir */}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Renderiza os filhos se o item estiver expandido */}
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