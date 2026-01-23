"use client"

import { SubcategoryItem } from "../SubcategoriesCard"

/**
 * Valida se um item pode ser movido para uma nova posição
 */
export function validateMove(
  draggedId: string,
  targetParentId: string | undefined,
  subcategories: SubcategoryItem[]
): { isValid: boolean; reason?: string } {
  const dragged = subcategories.find(item => item.id === draggedId)
  const targetParent = targetParentId 
    ? subcategories.find(item => item.id === targetParentId)
    : undefined

  if (!dragged) {
    return { isValid: false, reason: 'Item não encontrado' }
  }

  // 1. Não pode ser pai de si mesmo
  if (targetParentId === draggedId) {
    return { isValid: false, reason: 'Não pode mover para dentro de si mesmo' }
  }

  // 2. Não pode mover para um dos seus filhos (evitar loop)
  const isDescendant = (parentId: string, childId: string): boolean => {
    const children = subcategories.filter(item => item.parent === parentId)
    for (const child of children) {
      if (child.id === childId) return true
      if (isDescendant(child.id, childId)) return true
    }
    return false
  }

  if (targetParentId && isDescendant(draggedId, targetParentId)) {
    return { isValid: false, reason: 'Não pode mover para um descendente' }
  }

  // 3. Verificar nível máximo
  const newLevel = targetParent ? targetParent.level + 1 : 1
  if (newLevel > 4) {
    return { isValid: false, reason: 'Limite máximo de 4 níveis' }
  }

  return { isValid: true }
}

/**
 * Reordena subcategorias após movimento
 */
export function reorderSubcategories(
  draggedId: string,
  targetParentId: string | undefined,
  targetIndex: number,
  subcategories: SubcategoryItem[]
): SubcategoryItem[] {
  
  // Remove o item arrastado da lista
  const withoutDragged = subcategories.filter(item => item.id !== draggedId)
  
  // Encontra o item arrastado
  const dragged = subcategories.find(item => item.id === draggedId)!
  
  // Calcula novo nível baseado no pai
  const newLevel = targetParentId 
    ? (subcategories.find(item => item.id === targetParentId)?.level || 0) + 1
    : 1
  
  // Atualiza o item arrastado
  const updatedDragged = {
    ...dragged,
    level: newLevel,
    parent: targetParentId
  }
  
  // Insere na nova posição
  const result = [...withoutDragged]
  result.splice(targetIndex, 0, updatedDragged)
  
  // Atualiza níveis de todos os filhos (recursivamente)
  return updateChildrenLevels(result)
}

/**
 * Atualiza níveis de todos os filhos recursivamente
 */
function updateChildrenLevels(subcategories: SubcategoryItem[]): SubcategoryItem[] {
  const updated = [...subcategories]
  
  const updateLevels = (parentId: string, parentLevel: number) => {
    const children = updated.filter(item => item.parent === parentId)
    
    children.forEach(child => {
      const index = updated.findIndex(item => item.id === child.id)
      updated[index] = { ...child, level: parentLevel + 1 }
      updateLevels(child.id, parentLevel + 1)
    })
  }
  
  // Atualiza itens de nível 1 (sem pai)
  const rootItems = updated.filter(item => !item.parent)
  rootItems.forEach(item => {
    const index = updated.findIndex(i => i.id === item.id)
    updated[index] = { ...item, level: 1 }
    updateLevels(item.id, 1)
  })
  
  return updated
}