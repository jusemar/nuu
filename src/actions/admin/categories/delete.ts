"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { eq } from "drizzle-orm"

export async function deleteCategory(id: string) {
  try {
    // 1. Verifica se existe
    const [category] = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!category) {
      return { success: false, message: "Categoria não encontrada" }
    }

    // 2. Verifica se tem subcategorias
    const childCategories = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.parentId, id))

    if (childCategories.length > 0) {
      return { 
        success: false, 
        message: "Não pode excluir: categoria possui subcategorias. Exclua ou mova as subcategorias primeiro." 
      }
    }

    // 3. Se não tem filhos, exclui
    await db.delete(categoryTable).where(eq(categoryTable.id, id))

    revalidatePath("/admin/categories")
    return { success: true, message: "Categoria excluída!" }

  } catch (error) {
    console.error("Erro:", error)
    return { success: false, message: "Erro interno" }
  }
}