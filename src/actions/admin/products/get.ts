"use server"

import { db } from "@/db"
import { productTable, categoryTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProducts() {
  try {
    const products = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        description: productTable.description,
        categoryId: productTable.categoryId,
        categoryName: categoryTable.name,
        createdAt: productTable.createdAt,
      })
      .from(productTable)
      .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))

    return products
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return []
  }
}