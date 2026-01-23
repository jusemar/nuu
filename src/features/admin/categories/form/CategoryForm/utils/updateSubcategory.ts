"use client"

import { SubcategoryItem } from "../SubcategoriesCard"

/**
 * Atualiza o nome de uma subcategoria existente
 * 
 * @param id - ID da subcategoria a ser atualizada
 * @param newName - Novo nome para a subcategoria
 * @param subcategories - Array completo de subcategorias
 * @returns Novo array com a subcategoria atualizada
 * 
 * @example
 * // Atualiza nome da subcategoria "2" para "Molas Premium"
 * const atualizado = updateSubcategoryName("2", "Molas Premium", subcategories)
 */
export function updateSubcategoryName(
  id: string,
  newName: string,
  subcategories: SubcategoryItem[]
): SubcategoryItem[] {
  
  // Validação básica
  if (!newName || newName.trim() === '') {
    throw new Error('O nome da subcategoria não pode ser vazio')
  }

  if (newName.trim().length < 2) {
    throw new Error('O nome deve ter pelo menos 2 caracteres')
  }

  // Procura e atualiza a subcategoria
  return subcategories.map(item => {
    if (item.id === id) {
      return { ...item, name: newName.trim() }
    }
    return item
  })
}

/**
 * Valida se uma subcategoria pode ser editada
 * (útil para regras de negócio futuras)
 */
export function canEditSubcategory(
  subcategory: SubcategoryItem,
  subcategories: SubcategoryItem[]
): { canEdit: boolean; reason?: string } {
  
  // Sempre pode editar por enquanto
  // Futuro: validar permissões, status, etc.
  
  return { canEdit: true }
}

/**
 * Calcula se mudar o nível/pai é permitido
 * (evita loops infinitos na hierarquia)
 */
export function canChangeParent(
  subcategoryId: string,
  newParentId: string | undefined,
  subcategories: SubcategoryItem[]
): { canChange: boolean; reason?: string } {
  
  // Não pode ser pai de si mesmo
  if (newParentId === subcategoryId) {
    return { canChange: false, reason: 'Uma subcategoria não pode ser pai de si mesma' }
  }

  // Não pode ser pai de um dos seus filhos (loop)
  const isDescendant = (parentId: string, childId: string): boolean => {
    const children = subcategories.filter(item => item.parent === parentId)
    for (const child of children) {
      if (child.id === childId) return true
      if (isDescendant(child.id, childId)) return true
    }
    return false
  }

  if (newParentId && isDescendant(subcategoryId, newParentId)) {
    return { canChange: false, reason: 'Não pode tornar um descendente como pai' }
  }

  // Verifica limite de níveis (máximo 4)
  if (newParentId) {
    const parent = subcategories.find(item => item.id === newParentId)
    if (parent && parent.level >= 4) {
      return { canChange: false, reason: 'Limite máximo de 4 níveis atingido' }
    }
  }

  return { canChange: true }
}