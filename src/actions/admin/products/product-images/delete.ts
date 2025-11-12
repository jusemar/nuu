"use server"

import { db } from "@/db"
import { productImageTable } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

export async function deleteProductImage(id: string) {
  const [image] = await db
    .delete(productImageTable)
    .where(eq(productImageTable.id, id))
    .returning()
  
  revalidatePath(`/admin/products/[id]`)
  return image
}