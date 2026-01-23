"use client"

import { SubcategoryItem } from "../SubcategoriesCard"

/**
 * Remove uma subcategoria e TODOS os seus filhos (recursivamente)
 * 
 * @param id - ID da subcategoria a ser excluída
 * @param subcategories - Array completo de subcategorias
 * @returns Novo array SEM a subcategoria e seus filhos
 * 
 * @example
 * // Remove "Molas" e seus filhos "Pocket Spring"
 * const novaLista = deleteSubcategory("2", subcategories)
 */
export function deleteSubcategory(
  id: string, 
  subcategories: SubcategoryItem[]
): SubcategoryItem[] {
  
  // 1. Encontra TODOS os IDs para excluir (pai + filhos recursivos)
  const idsToDelete = new Set<string>([id])
  
  // Função recursiva para encontrar filhos
  const findChildrenIds = (parentId: string) => {
    const children = subcategories.filter(item => item.parent === parentId)
    
    children.forEach(child => {
      idsToDelete.add(child.id) // Adiciona o filho
      findChildrenIds(child.id) // Procura netos, bisnetos, etc.
    })
  }
  
  // Começa a busca pelos filhos
  findChildrenIds(id)
  
  // 2. Filtra a lista original, removendo todos os IDs marcados
  const filtered = subcategories.filter(item => !idsToDelete.has(item.id))
  
  console.log(`🗑️ Excluindo ${idsToDelete.size} subcategoria(s):`, Array.from(idsToDelete))
  
  return filtered
}

/**
 * Versão alternativa que também retorna os IDs excluídos (útil para limpar expandedItems)
 */
export function deleteSubcategoryWithDetails(
  id: string, 
  subcategories: SubcategoryItem[]
): { newList: SubcategoryItem[]; deletedIds: string[] } {
  const idsToDelete = new Set<string>([id])
  
  const findChildrenIds = (parentId: string) => {
    const children = subcategories.filter(item => item.parent === parentId)
    children.forEach(child => {
      idsToDelete.add(child.id)
      findChildrenIds(child.id)
    })
  }
  
  findChildrenIds(id)
  
  const newList = subcategories.filter(item => !idsToDelete.has(item.id))
  const deletedIds = Array.from(idsToDelete)
  
  return { newList, deletedIds }
}