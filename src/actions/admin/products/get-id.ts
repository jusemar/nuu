"use server"

import { db } from "@/db"
import { productTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProduct(id: string) {
  try {
    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1)

    if (!product) {
      return {
        success: false,
        message: "Produto não encontrado",
        data: null
      }
    }

    return {
      success: true,
      message: "Produto encontrado com sucesso",
      data: product
    }

  } catch (error: any) {
    console.error("Erro ao buscar produto:", error)
    return {
      success: false,
      message: "Erro interno ao buscar produto",
      data: null
    }
  }
}