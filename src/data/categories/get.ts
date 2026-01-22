"use server"

import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { isNull } from "drizzle-orm"  // ← ADICIONAR ESTE IMPORT

export async function getCategories() {
  try {
    // ANTES:
    // const categories = await db.select().from(categoryTable)
    
    // DEPOIS (categorias raiz apenas):
    const categories = await db
      .select()
      .from(categoryTable)
      .where(isNull(categoryTable.parentId))  // ← FILTRA SÓ RAÍZ
      .orderBy(categoryTable.orderIndex)      // ← ORDENA
    
    return categories
  } catch (error) {
    throw new Error("Erro ao buscar categorias")
  }
}