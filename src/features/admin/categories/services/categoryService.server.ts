'use server'

import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { categoryTable } from '@/db/table/categories/categories'

/**
 * Server Functions para deletar/restaurar categoria
 * Arquivo separado com 'use server' no topo para ser usado em Client Components
 */
export async function deleteCategoryServer(
  id: string,
  type: 'soft' | 'hard' | 'restore' = 'soft'
) {
  try {
    console.log(`[categoryService.server.deleteCategoryServer] Iniciando ${type} para ID: ${id}`)

    // Validar se categoria existe
    const categoryExists = await db
      .select({ id: categoryTable.id, name: categoryTable.name })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!categoryExists || categoryExists.length === 0) {
      return {
        success: false,
        message: 'Categoria não encontrada'
      }
    }

    console.log(`[categoryService.server.deleteCategoryServer] Categoria encontrada: ${categoryExists[0].name}`)

    // Para restore, não precisa verificar subcategorias
    if (type === 'restore') {
      const result = await db
        .update(categoryTable)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(categoryTable.id, id))
        .returning({
          id: categoryTable.id,
          name: categoryTable.name,
          isActive: categoryTable.isActive
        })

      console.log(`[categoryService.server.deleteCategoryServer] Restore completo para: ${result[0]?.name}`)
      return {
        success: true,
        message: 'Categoria restaurada com sucesso',
        data: result[0]
      }
    }

    // Verificar subcategorias antes de soft/hard delete
    const hasChildren = await db
      .select({ id: categoryTable.id })
      .from(categoryTable)
      .where(
        and(
          eq(categoryTable.parentId, id),
          isNotNull(categoryTable.parentId)
        )
      )
      .limit(1)

    if (hasChildren && hasChildren.length > 0) {
      return {
        success: false,
        message: 'Não é possível excluir categoria com subcategorias'
      }
    }

    if (type === 'soft') {
      const result = await db
        .update(categoryTable)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(categoryTable.id, id))
        .returning({
          id: categoryTable.id,
          name: categoryTable.name,
          isActive: categoryTable.isActive
        })

      console.log(`[categoryService.server.deleteCategoryServer] Soft delete completo para: ${result[0]?.name}`)
      return {
        success: true,
        message: 'Categoria marcada como inativa',
        data: result[0]
      }
    } else if (type === 'hard') {
      try {
        const result = await db
          .delete(categoryTable)
          .where(eq(categoryTable.id, id))
          .returning({
            id: categoryTable.id,
            name: categoryTable.name
          })

        console.log(`[categoryService.server.deleteCategoryServer] Hard delete completo para: ${result[0]?.name}`)
        return {
          success: true,
          message: 'Categoria excluída permanentemente',
          data: result[0]
        }
      } catch (hardDeleteError) {
        // Se hard delete falhar por constraint, usa soft delete como fallback
        console.log(`[categoryService.server.deleteCategoryServer] Hard delete falhou, tentando soft delete`)
        const result = await db
          .update(categoryTable)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(categoryTable.id, id))
          .returning({
            id: categoryTable.id,
            name: categoryTable.name,
            isActive: categoryTable.isActive
          })

        return {
          success: true,
          message: 'Categoria marcada como inativa (deletar bloqueado por constraint)',
          data: result[0]
        }
      }
    }

    return {
      success: false,
      message: 'Tipo de operação inválido'
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error(`[categoryService.server.deleteCategoryServer] Erro:`, errorMsg)
    return {
      success: false,
      message: `Erro ao deletar categoria: ${errorMsg}`
    }
  }
}

/**
 * Server Function para restaurar categoria
 * Wrapper que chama deleteCategoryServer com type: 'restore'
 */
export async function restoreCategoryServer(id: string) {
  return deleteCategoryServer(id, 'restore')
}

/**
 * Server Function para buscar categoria com subcategorias
 * Usado por useCategoryDetail hook para evitar GET HTTP que não existe
 */
export async function getCategoryByIdServer(id: string) {
  try {
    console.log(`[getCategoryByIdServer] 🔍 Buscando categoria ID: ${id}`)

    // Busca a categoria principal
    const mainCategory = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        parentId: categoryTable.parentId,
        level: categoryTable.level,
        orderIndex: categoryTable.orderIndex,
        imageUrl: categoryTable.imageUrl,
        metaTitle: categoryTable.metaTitle,
        metaDescription: categoryTable.metaDescription,
        isActive: categoryTable.isActive,
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt
      })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!mainCategory || mainCategory.length === 0) {
      console.log(`[getCategoryByIdServer] ❌ Categoria ID ${id} não encontrada`)
      return {
        success: false,
        message: 'Categoria não encontrada',
        data: null
      }
    }

    console.log(`[getCategoryByIdServer] ✅ Categoria encontrada: ${mainCategory[0].name}`)

    // Busca subcategorias
    const subcategories = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        parentId: categoryTable.parentId,
        level: categoryTable.level,
        orderIndex: categoryTable.orderIndex,
        imageUrl: categoryTable.imageUrl,
        metaTitle: categoryTable.metaTitle,
        metaDescription: categoryTable.metaDescription,
        isActive: categoryTable.isActive,
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt
      })
      .from(categoryTable)
      .where(eq(categoryTable.parentId, id))

    console.log(`[getCategoryByIdServer] 📊 Encontradas ${subcategories.length} subcategorias`)

    return {
      success: true,
      data: {
        ...mainCategory[0],
        subcategories
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error(`[getCategoryByIdServer] ❌ Erro:`, errorMsg)
    return {
      success: false,
      message: `Erro ao buscar categoria: ${errorMsg}`,
      data: null
    }
  }
}
