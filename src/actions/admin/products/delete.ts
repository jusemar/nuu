"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { productTable,productPricingTable  } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function deleteProduct(id: string) {
  try {
    // ✅ PRIMERO excluir modalidades de preço
    await db
      .delete(productPricingTable)
      .where(eq(productPricingTable.productId, id))

    // ✅ DEPOIS excluir produto principal
    await db
      .delete(productTable)
      .where(eq(productTable.id, id))

    revalidatePath("/admin/products")
    return { success: true, message: "Produto deletado com sucesso!" }

  } catch (error: any) {
    console.error("Erro ao deletar produto:", error)
    return { success: false, message: "Erro interno ao deletar produto" }
  }
}