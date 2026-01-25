/**
 * Service Layer para operações de Categoria e Subcategoria
 * 
 * Responsabilidades:
 * - Encapsular toda a lógica de banco de dados (Drizzle)
 * - Garantir type safety com TypeScript
 * - Lidar com transactions para operações complexas
 * - Fornecer interface limpa para os hooks
 * 
 * Princípios:
 * - Cada método é uma operação atômica
 * - Retorna objetos serializáveis (sem instâncias de classe)
 * - Lida com erros de banco e converte para erros de aplicação
 */

import { db } from "@/lib/db"
import { categories, subcategories } from "@/db/schema"
import { 
  eq, 
  and, 
  desc, 
  sql,
  inArray 
} from "drizzle-orm"
import { revalidatePath } from "next/cache"

// Tipos de entrada (Input Types)
interface CreateCategoryInput {
  name: string
  slug: string
  description?: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
  orderIndex: number
  userId: string
}

interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string
  isActive?: boolean
  metaTitle?: string
  metaDescription?: string
  orderIndex?: number
}

interface CreateSubcategoryInput {
  name: string
  slug: string
  level: number
  parentId?: string
  categoryId: string
  orderIndex: number
}

interface UpdateSubcategoryInput {
  name?: string
  slug?: string
  level?: number
  parentId?: string
  orderIndex?: number
}

interface ReorderSubcategoriesInput {
  categoryId: string
  updates: Array<{
    id: string
    level: number
    parentId?: string
    orderIndex: number
  }>
}

/**
 * Serviço principal para operações de categoria
 */
export const categoryService = {
  // ========== OPERAÇÕES DE CATEGORIA ==========
  
  /**
   * Cria uma nova categoria
   */
  async createCategory(data: CreateCategoryInput) {
    try {
      const [category] = await db
        .insert(categories)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
      
      // Revalida cache para refletir mudanças
      revalidatePath('/admin/categories')
      
      return category
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw new Error('Falha ao criar categoria')
    }
  },
  
  /**
   * Atualiza uma categoria existente
   */
  async updateCategory(id: string, data: UpdateCategoryInput) {
    try {
      const [updated] = await db
        .update(categories)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(categories.id, id))
        .returning()
      
      if (!updated) {
        throw new Error('Categoria não encontrada')
      }
      
      revalidatePath(`/admin/categories/${id}`)
      revalidatePath('/admin/categories')
      
      return updated
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw new Error('Falha ao atualizar categoria')
    }
  },
  
  /**
   * Exclui uma categoria e todas as suas subcategorias
   * Usa transaction para garantir atomicidade
   */
  async deleteCategory(id: string) {
    try {
      return await db.transaction(async (tx) => {
        // Primeiro exclui todas as subcategorias
        await tx
          .delete(subcategories)
          .where(eq(subcategories.categoryId, id))
        
        // Depois exclui a categoria
        const [deleted] = await tx
          .delete(categories)
          .where(eq(categories.id, id))
          .returning()
        
        if (!deleted) {
          throw new Error('Categoria não encontrada')
        }
        
        revalidatePath('/admin/categories')
        
        return deleted
      })
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      throw new Error('Falha ao excluir categoria')
    }
  },
  
  /**
   * Busca categoria por ID com todas as subcategorias aninhadas
   */
  async getCategoryWithSubcategories(id: string) {
    try {
      // Busca a categoria
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, id)
      })
      
      if (!category) {
        return null
      }
      
      // Busca todas as subcategorias desta categoria
      const allSubcategories = await db.query.subcategories.findMany({
        where: eq(subcategories.categoryId, id),
        orderBy: [subcategories.orderIndex]
      })
      
      // Função para construir hierarquia
      const buildHierarchy = (parentId?: string) => {
        return allSubcategories
          .filter(sub => sub.parentId === parentId)
          .map(sub => ({
            ...sub,
            children: buildHierarchy(sub.id)
          }))
      }
      
      const hierarchicalSubcategories = buildHierarchy()
      
      return {
        ...category,
        subcategories: hierarchicalSubcategories
      }
    } catch (error) {
      console.error('Erro ao buscar categoria:', error)
      throw new Error('Falha ao buscar categoria')
    }
  },
  
  /**
   * Lista todas as categorias com contagem de subcategorias
   */
  async listCategories() {
    try {
      const cats = await db.query.categories.findMany({
        orderBy: [categories.orderIndex, desc(categories.createdAt)],
        with: {
          subcategories: {
            columns: {
              id: true
            }
          }
        }
      })
      
      return cats.map(category => ({
        ...category,
        subcategoriesCount: category.subcategories.length
      }))
    } catch (error) {
      console.error('Erro ao listar categorias:', error)
      throw new Error('Falha ao listar categorias')
    }
  },
  
  // ========== OPERAÇÕES DE SUBCATEGORIA ==========
  
  /**
   * Cria uma nova subcategoria
   */
  async createSubcategory(data: CreateSubcategoryInput) {
    try {
      const [subcategory] = await db
        .insert(subcategories)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
      
      revalidatePath(`/admin/categories/${data.categoryId}`)
      
      return subcategory
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error)
      throw new Error('Falha ao criar subcategoria')
    }
  },
  
  /**
   * Atualiza uma subcategoria existente
   */
  async updateSubcategory(id: string, data: UpdateSubcategoryInput) {
    try {
      const [updated] = await db
        .update(subcategories)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(subcategories.id, id))
        .returning()
      
      if (!updated) {
        throw new Error('Subcategoria não encontrada')
      }
      
      // Revalida a página da categoria pai
      if (updated.categoryId) {
        revalidatePath(`/admin/categories/${updated.categoryId}`)
      }
      
      return updated
    } catch (error) {
      console.error('Erro ao atualizar subcategoria:', error)
      throw new Error('Falha ao atualizar subcategoria')
    }
  },
  
  /**
   * Exclui uma subcategoria e todos os seus filhos (recursivamente)
   */
  async deleteSubcategory(id: string) {
    try {
      return await db.transaction(async (tx) => {
        // Função recursiva para encontrar todos os IDs de filhos
        const findAllChildIds = async (parentId: string): Promise<string[]> => {
          const children = await tx.query.subcategories.findMany({
            where: eq(subcategories.parentId, parentId),
            columns: { id: true }
          })
          
          let allIds: string[] = []
          for (const child of children) {
            allIds.push(child.id)
            const grandChildren = await findAllChildIds(child.id)
            allIds = [...allIds, ...grandChildren]
          }
          
          return allIds
        }
        
        // Encontra todos os IDs para excluir
        const idsToDelete = [id, ...await findAllChildIds(id)]
        
        // Exclui todos em uma única query
        await tx
          .delete(subcategories)
          .where(inArray(subcategories.id, idsToDelete))
        
        // Busca a categoria para revalidar cache
        const subcategory = await tx.query.subcategories.findFirst({
          where: eq(subcategories.id, id),
          columns: { categoryId: true }
        })
        
        if (subcategory?.categoryId) {
          revalidatePath(`/admin/categories/${subcategory.categoryId}`)
        }
        
        return { deletedCount: idsToDelete.length }
      })
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error)
      throw new Error('Falha ao excluir subcategoria')
    }
  },
  
  /**
   * Reordena múltiplas subcategorias em uma única transaction
   * Usado após drag-and-drop
   */
  async reorderSubcategories(data: ReorderSubcategoriesInput) {
    try {
      return await db.transaction(async (tx) => {
        const updates = data.updates.map(update =>
          tx.update(subcategories)
            .set({
              level: update.level,
              parentId: update.parentId,
              orderIndex: update.orderIndex,
              updatedAt: new Date()
            })
            .where(eq(subcategories.id, update.id))
        )
        
        await Promise.all(updates)
        
        revalidatePath(`/admin/categories/${data.categoryId}`)
        
        return { updatedCount: updates.length }
      })
    } catch (error) {
      console.error('Erro ao reordenar subcategorias:', error)
      throw new Error('Falha ao reordenar subcategorias')
    }
  },
  
  /**
   * Busca subcategoria por ID
   */
  async getSubcategory(id: string) {
    try {
      const subcategory = await db.query.subcategories.findFirst({
        where: eq(subcategories.id, id)
      })
      
      if (!subcategory) {
        throw new Error('Subcategoria não encontrada')
      }
      
      return subcategory
    } catch (error) {
      console.error('Erro ao buscar subcategoria:', error)
      throw new Error('Falha ao buscar subcategoria')
    }
  }
}