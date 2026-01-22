"use server"

import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { isNull } from "drizzle-orm" 

export async function getCategories() {
  try {
     const categories = await db
      .select()
      .from(categoryTable)
      .where(isNull(categoryTable.parentId))
    return categories
  } catch (error) {
    throw new Error("Erro ao buscar categorias")
  }
}