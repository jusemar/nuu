"use server"

import { db } from "@/db"
import { productTable, categoryTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProducts() {
  try {
    const products = await db
      .select({
        // Campos básicos
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        description: productTable.description,
        brand: productTable.brand,
        
        // Códigos
        sku: productTable.sku,
        
        // Status
        status: productTable.status,
        isActive: productTable.isActive,
        
        // Preços
        costPrice: productTable.costPrice,
        salePrice: productTable.salePrice,
        promoPrice: productTable.promoPrice,
        
        // Categoria
        categoryId: productTable.categoryId,
        categoryName: categoryTable.name,
        
        // Timestamps
        createdAt: productTable.createdAt,
        updatedAt: productTable.updatedAt,
      })
      .from(productTable)
      .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
      .orderBy(productTable.updatedAt)

    return products
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return []
  }
}