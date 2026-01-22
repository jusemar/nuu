"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { eq, and, not } from "drizzle-orm"

export async function updateCategory(id: string, data: Partial<{
  name: string
  slug: string
  description?: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
  // NOVOS CAMPOS:
  parentId?: string | null
  orderIndex?: number
  imageUrl?: string
}>) {
  try {
    // 1. Verificar se a categoria existe
    const [existingCategory] = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!existingCategory) {
      return {
        success: false,
        message: "Categoria não encontrada"
      }
    }

    // 2. VALIDAÇÃO CRÍTICA: Não pode ser pai de si mesma
    if (data.parentId === id) {
      return {
        success: false,
        message: "Uma categoria não pode ser pai de si mesma"
      }
    }

    // 3. VALIDAÇÃO: Não pode criar loops na hierarquia
    // Opção mais simples e segura:
if (data.parentId) {
  // Verifica apenas 1 nível (evita complexidade excessiva)
  const [parentCheck] = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.parentId, id))
    .limit(1)
  
  if (parentCheck?.id === data.parentId) {
    return {
      success: false,
      message: "Não pode fazer referência circular direta"
    }
  }
}

    // 4. Calcular novo nível se parentId mudou
    let newLevel = existingCategory.level
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        newLevel = 0 // Tornou-se raiz
      } else {
        // Busca nível do novo pai
        const [newParent] = await db
          .select({ level: categoryTable.level })
          .from(categoryTable)
          .where(eq(categoryTable.id, data.parentId))
          .limit(1)
        
        if (!newParent) {
          return {
            success: false,
            message: "Categoria pai não encontrada"
          }
        }
        newLevel = newParent.level + 1
      }
    }

    // 5. Atualizar no banco (com nível recalculado)
    const [updatedCategory] = await db
      .update(categoryTable)
      .set({
        ...data,
        level: newLevel, // Nível calculado
        updatedAt: new Date()
      })
      .where(eq(categoryTable.id, id))
      .returning()

    console.log("Categoria atualizada:", updatedCategory.id)

    // 6. ATUALIZAR NÍVEL DOS FILHOS (se nível mudou)
    if (newLevel !== existingCategory.level) {
      const difference = newLevel - existingCategory.level
      
      // Atualiza todos os descendentes
      const updateDescendants = async (parentId: string, levelAdjustment: number) => {
        const children = await db
          .select()
          .from(categoryTable)
          .where(eq(categoryTable.parentId, parentId))
        
        for (const child of children) {
          await db
            .update(categoryTable)
            .set({
              level: child.level + levelAdjustment,
              updatedAt: new Date()
            })
            .where(eq(categoryTable.id, child.id))
          
          // Recursivo para netos, bisnetos...
          await updateDescendants(child.id, levelAdjustment)
        }
      }
      
      await updateDescendants(id, difference)
    }

    // 7. Revalidar cache
    revalidatePath("/admin/categories")
    revalidatePath("/categories") // Páginas públicas também

    return {
      success: true,
      message: "Categoria atualizada com sucesso!",
      data: updatedCategory
    }

  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error)
    
    if (error.code === '23505') {
      return {
        success: false,
        message: "Já existe uma categoria com este slug"
      }
    }
    
    return {
      success: false,
      message: "Erro interno ao atualizar categoria"
    }
  }
}