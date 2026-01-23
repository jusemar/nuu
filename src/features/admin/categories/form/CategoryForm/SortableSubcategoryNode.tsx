"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SubcategoryNode } from './SubcategoryNode'
import { DropZone } from './DropZone' // ← NOVO IMPORT
import { SubcategoryItem } from './SubcategoriesCard'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable' // ← NOVO IMPORT

interface SortableSubcategoryNodeProps {
  item: SubcategoryItem
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
  onDeleteSubcategory: (id: string) => void
  onEditSubcategory: (id: string, newName: string) => void
  onAddChildSubcategory: (parentId: string, name: string) => void
  activeDragId?: string | null // ← NOVO: Para saber se está arrastando
}

export function SortableSubcategoryNode({
  item,
  subcategories,
  expandedItems,
  toggleExpand,
  getLevelColor,
  getLevelBadge,
  onDeleteSubcategory,
  onEditSubcategory,
  onAddChildSubcategory,
  activeDragId // ← RECEBENDO
}: SortableSubcategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'subcategory',
      parentId: item.parent
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto'
  }

  // 🔽🔽🔽 FUNÇÃO PARA RENDERIZAR FILHOS COM DROP ZONES 🔽🔽🔽
  const renderChildrenWithDropZones = () => {
    const children = subcategories.filter(child => child.parent === item.id)
    const isExpanded = expandedItems.includes(item.id)
    
    if (!isExpanded || children.length === 0) return null

    const childIds = children.map(child => child.id)

    return (
      <div className="ml-6">
        <SortableContext 
          items={childIds}
          strategy={verticalListSortingStrategy}
        >
          {/* Drop zone no início dos filhos */}
          <DropZone
            key={`dropzone-child-start-${item.id}`}
            id={`dropzone-child-start-${item.id}`}
            parentId={item.id}
            index={0}
            position="before"
            isActive={!!activeDragId}
          />
          
          {children.map((child, index) => (
            <div key={child.id}>
              {/* Drop zone antes do filho */}
              <DropZone
                key={`dropzone-child-before-${child.id}`}
                id={`dropzone-child-before-${child.id}`}
                parentId={item.id}
                index={index}
                position="before"
                isActive={!!activeDragId}
              />
              
              {/* Recursivo: o filho também é sortable */}
              <SortableSubcategoryNode
                item={child}
                subcategories={subcategories}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                getLevelColor={getLevelColor}
                getLevelBadge={getLevelBadge}
                onDeleteSubcategory={onDeleteSubcategory}
                onEditSubcategory={onEditSubcategory}
                onAddChildSubcategory={onAddChildSubcategory}
                activeDragId={activeDragId} // ← PASSANDO ADIANTE
              />
              
              {/* Drop zone depois do filho */}
              <DropZone
                key={`dropzone-child-after-${child.id}`}
                id={`dropzone-child-after-${child.id}`}
                parentId={item.id}
                index={index + 1}
                position="after"
                isActive={!!activeDragId}
              />
            </div>
          ))}
        </SortableContext>
      </div>
    )
  }
  // 🔼🔼🔼 FIM DA FUNÇÃO 🔼🔼🔼

  return (
    <div ref={setNodeRef} style={style}>
      <SubcategoryNode
        item={item}
        subcategories={subcategories}
        expandedItems={expandedItems}
        toggleExpand={toggleExpand}
        getLevelColor={getLevelColor}
        getLevelBadge={getLevelBadge}
        onDeleteSubcategory={onDeleteSubcategory}
        onEditSubcategory={onEditSubcategory}
        onAddChildSubcategory={onAddChildSubcategory}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
      
      {/* Renderiza filhos com drop zones */}
      {renderChildrenWithDropZones()}
    </div>
  )
}