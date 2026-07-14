"use server"

import { db } from "@/db/connection"
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
    const causa = error instanceof Error ? error.cause : null
    const codigo =
      causa && typeof causa === "object" && "code" in causa
        ? String(causa.code)
        : undefined

    console.error("[categorias:loja:indisponivel]", {
      mensagem: error instanceof Error ? error.message : "Erro desconhecido",
      codigo,
    })

    return []
  }
}
