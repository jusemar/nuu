"use server"

import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { eq } from 'drizzle-orm'

// Tipo que representa uma categoria (igual ao que o componente espera)
export type Category = {
  id: string
  name: string
  parentId: string | null
  level: number
  status: 'active' | 'inactive'  // O componente espera 'active' ou 'inactive'
  createdAt: string               // O componente espera string (data formatada)
  updatedAt: string 
  deleted_at: string | null       // Para soft delete (se não tiver, deixa null)
  children?: Category[]
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    // 1. Busca TODAS as categorias do banco
    // Usando os nomes REAIS das colunas da sua tabela
    const allCategories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        isActive: categoryTable.isActive,     // Nome real no banco é isActive
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt,
        // Se não tem deleted_at, não seleciona
      })
      .from(categoryTable)
      .orderBy(categoryTable.orderIndex)

    // 2. Mapeia para objeto com level e children
    const categoryMap = new Map<string, Category>()
    
    // Primeiro cria todos os objetos (convertendo os tipos)
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        // Converte isActive (boolean) para 'active' ou 'inactive'
        status: cat.isActive ? 'active' : 'inactive',
        // Converte Date para string ISO
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
        // Se não tem deleted_at no banco, deixa null
        deleted_at: null,
        level: 0, // Será calculado depois
        children: []
      })
    })

    // 3. Função recursiva para construir a árvore e calcular níveis
    const buildTree = (parentId: string | null = null, level: number = 0): Category[] => {
      // Filtra categorias que têm este parentId
      const children = allCategories
        .filter(cat => cat.parentId === parentId)
        .map(cat => {
          // Pega o objeto que criamos no map
          const category = categoryMap.get(cat.id)!
          // Define o nível correto
          category.level = level
          // Busca os filhos recursivamente (nível +1)
          category.children = buildTree(cat.id, level + 1)
          return category
        })
      
      return children
    }

    // 4. Constrói árvore a partir das raízes (parentId = null)
    const categoriesTree = buildTree(null, 0)

    return categoriesTree

  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    throw new Error("Erro ao buscar categorias")
  }
}

// Função para excluir categoria (soft ou hard delete)
export async function deleteCategory(id: string, type: 'soft' | 'hard'): Promise<void> {
  try {
    if (type === 'hard') {
      // Hard delete: remove permanentemente
      await db
        .delete(categoryTable)
        .where(eq(categoryTable.id, id))
    } else {
      // Soft delete: apenas marca como inativo
      await db
        .update(categoryTable)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(categoryTable.id, id))
    }
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    throw new Error("Erro ao excluir categoria")
  }
}