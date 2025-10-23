"use server"

import { db } from "@/db"
import { categoryTable } from "@/db/table/categories"

export async function getCategories() {
  try {
    const categories = await db.select().from(categoryTable)
    return categories
  } catch (error) {
    throw new Error("Erro ao buscar categorias")
  }
}