"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { eq } from "drizzle-orm"

export async function deleteCategory(id: string) {
  try {
    const [category] = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!category) {
      return {
        success: false,
        message: "Categoria não encontrada"
      }
    }

    await db
      .delete(categoryTable)
      .where(eq(categoryTable.id, id))

    revalidatePath("/admin/categories")

    return {
      success: true,
      message: "Categoria deletada com sucesso!"
    }

  } catch (error: any) {
    console.error("Erro ao deletar categoria:", error)
    return {
      success: false,
      message: "Erro interno ao deletar categoria"
    }
  }
}