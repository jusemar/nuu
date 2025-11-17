"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { productTable } from "@/db/schema"
import { eq } from "drizzle-orm"

interface UpdateProductData {
  name: string
  slug: string
  description: string
  categoryId: string
  brand?: string
  sku: string
  isActive: boolean
  collection?: string
  tags?: string[]
  productType?: string
  productCode?: string
  ncmCode?: string
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
}

export async function updateProduct(id: string, data: UpdateProductData) {
  try {
    const [existingProduct] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1)

    if (!existingProduct) {
      return {
        success: false,
        message: "Produto não encontrado"
      }
    }

    await db
      .update(productTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(productTable.id, id))

    revalidatePath("/admin/products")

    return {
      success: true,
      message: "Produto atualizado com sucesso!"
    }

  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error)
    return {
      success: false,
      message: "Erro interno ao atualizar produto"
    }
  }
}