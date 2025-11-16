"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { productTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function deleteProduct(id: string) {
  try {
    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1)

    if (!product) {
      return {
        success: false,
        message: "Produto não encontrado"
      }
    }

    await db
      .delete(productTable)
      .where(eq(productTable.id, id))

    revalidatePath("/admin/products")

    return {
      success: true,
      message: "Produto deletado com sucesso!"
    }

  } catch (error: any) {
    console.error("Erro ao deletar produto:", error)
    return {
      success: false,
      message: "Erro interno ao deletar produto"
    }
  }
}