"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories"
import { eq } from "drizzle-orm"

export async function updateCategory(id: string, data: Partial<{
  name: string
  slug: string
  description?: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}>) {
  try {
    // Verificar se a categoria existe
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

    // Atualizar no banco
    const [updatedCategory] = await db
      .update(categoryTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(categoryTable.id, id))
      .returning()

    console.log("Categoria atualizada:", updatedCategory.id)

    // Revalidar cache
    revalidatePath("/admin/categories")

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