"use client"

import { SubcategoryItem } from "../SubcategoriesCard"
import { generateSubcategoryId } from "./subcategory.helpers"

/**
 * Cria uma nova subcategoria filha
 * 
 * @param parentId - ID da subcategoria que será o pai
 * @param name - Nome da nova subcategoria filha
 * @param subcategories - Lista completa para encontrar o pai e validar
 * @returns Objeto da nova subcategoria filha pronta para ser adicionada
 * 
 * @throws {Error} Se o pai não for encontrado
 * @throws {Error} Se atingir o limite de 4 níveis
 * @throws {Error} Se o nome for vazio
 * 
 * @example
 * // Cria "Pocket Spring" como filho de "Molas"
 * const novaSubcategoria = createChildSubcategory("2", "Pocket Spring", subcategories)
 */
export function createChildSubcategory(
  parentId: string,
  name: string,
  subcategories: SubcategoryItem[]
): SubcategoryItem {
  // 1. Encontra a subcategoria pai
  const parent = subcategories.find(item => item.id === parentId)
  
  if (!parent) {
    throw new Error('Subcategoria pai não encontrada')
  }
  
  // 2. Valida nível máximo (não pode passar de 4)
  if (parent.level >= 4) {
    throw new Error('Limite máximo de 4 níveis atingido. Não é possível adicionar mais subníveis.')
  }
  
  // 3. Valida nome
  if (!name || name.trim() === '') {
    throw new Error('O nome da subcategoria não pode ser vazio')
  }
  
  if (name.trim().length < 2) {
    throw new Error('O nome deve ter pelo menos 2 caracteres')
  }
  
  // 4. Cria o objeto da nova subcategoria filha
  const newSubcategory: SubcategoryItem = {
    id: generateSubcategoryId(),
    name: name.trim(),
    level: parent.level + 1, // Nível é sempre um a mais que o pai
    parent: parentId,       // Referência ao pai
    expanded: false,        // Começa recolhida
    childrenCount: 0        // Sem filhos inicialmente
  }
  
  return newSubcategory
}

/**
 * Calcula a posição correta para inserir o filho (imediatamente após o pai)
 * 
 * @param parentId - ID do pai
 * @param subcategories - Lista atual
 * @returns Índice onde o filho deve ser inserido
 */
export function calculateChildInsertPosition(
  parentId: string,
  subcategories: SubcategoryItem[]
): number {
  const parentIndex = subcategories.findIndex(item => item.id === parentId)
  
  if (parentIndex === -1) {
    return subcategories.length // Adiciona no final se pai não encontrado
  }
  
  // Encontra a posição após o pai e seus outros filhos
  let insertIndex = parentIndex + 1
  
  // Avança enquanto encontrar filhos do mesmo pai
  while (
    insertIndex < subcategories.length && 
    subcategories[insertIndex].parent === parentId
  ) {
    insertIndex++
  }
  
  return insertIndex
}