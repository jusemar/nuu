"use client"

import { useState, useCallback } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners, // ← TROCADO: Melhor para hierarquia
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
  DragOverEvent, // ← NOVO: Para detectar durante arraste
  UniqueIdentifier
} from '@dnd-kit/core'
import { 
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SubcategoryItem } from '../SubcategoriesCard'
import { validateMove, reorderSubcategories } from '../utils/reorderSubcategories'

/**
 * Hook para gerenciar drag-and-drop de subcategorias
 */
export function useSubcategoryDnD(
  subcategories: SubcategoryItem[],
  onReorder: (newOrder: SubcategoryItem[]) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null) // ← NOVO: Item sob o cursor
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // ← REDUZIDO: Mais sensível
      },
    })
  )

  /**
   * Quando começa a arrastar
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  /**
   * Quando está arrastando sobre algo
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id || null)
  }, [])

  /**
   * Quando solta o item
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string
    const overData = over.data.current

    // Determina posição baseada nos dados do over
    let targetParentId: string | undefined
    let targetIndex: number
    let insertPosition: 'before' | 'after' | 'inside' = 'inside'

    if (overData?.type === 'subcategory') {
      // Verifica se está sobre a metade superior ou inferior do item
      const rect = over.rect
      const clientY = event.clientY || 0
      const relativeY = clientY - rect.top
      const middleY = rect.height / 2

      if (relativeY < middleY) {
        // Soltando ANTES do item
        insertPosition = 'before'
        targetParentId = overData.parentId
        targetIndex = subcategories.findIndex(item => item.id === overId)
      } else {
        // Soltando DEPOIS do item
        insertPosition = 'after'
        targetParentId = overData.parentId
        
        // Encontra o índice logo após este item
        const currentIndex = subcategories.findIndex(item => item.id === overId)
        targetIndex = currentIndex + 1
        
        // Avança enquanto for filho do mesmo pai
        while (
          targetIndex < subcategories.length && 
          subcategories[targetIndex]?.parent === overData.parentId
        ) {
          targetIndex++
        }
      }
    } else if (overData?.type === 'dropzone') {
      // Soltando em uma zona de drop específica
      insertPosition = overData.position // 'before' ou 'after'
      targetParentId = overData.parentId
      targetIndex = overData.index
    } else {
      // Fallback
      targetParentId = overData?.parentId
      targetIndex = subcategories.findIndex(item => item.id === overId)
    }

    // Valida o movimento
    const validation = validateMove(draggedId, targetParentId, subcategories)
    if (!validation.isValid) {
      alert(validation.reason)
      return
    }

    // Se soltando DENTRO de um item (para fazer filho)
    if (insertPosition === 'inside') {
      targetParentId = overId
      const parentIndex = subcategories.findIndex(item => item.id === overId)
      targetIndex = parentIndex + 1
      
      // Avança enquanto encontrar filhos do mesmo pai
      while (
        targetIndex < subcategories.length && 
        subcategories[targetIndex].parent === overId
      ) {
        targetIndex++
      }
    }

    // Reordena
    const newOrder = reorderSubcategories(
      draggedId,
      targetParentId,
      targetIndex,
      subcategories
    )

    onReorder(newOrder)
  }, [subcategories, onReorder])

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  }

  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }

  return {
    activeId,
    overId, // ← EXPORTADO: Para feedback visual
    sensors,
    DndContext,
    DragOverlay,
    SortableContext,
    verticalListSortingStrategy,
    closestCorners, // ← EXPORTADO
    handleDragStart,
    handleDragOver, // ← EXPORTADO
    handleDragEnd,
    dropAnimation,
    measuringConfig
  }
}