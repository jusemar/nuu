"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories"
import { inArray } from "drizzle-orm"

export async function deleteCategories(ids: string[]) {
  try {
    await db.delete(categoryTable).where(inArray(categoryTable.id, ids))
    revalidatePath("/admin/categories")
    return { success: true, message: `Excluídos ${ids.length} itens!` }
  } catch (error) {
    console.error("Erro ao deletar categorias:", error)
    return { success: false, message: "Erro ao deletar categorias" }
  }
}