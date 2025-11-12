"use server"

import { db } from "@/db"
import { productImageTable } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

export async function updateProductImageOrder(id: string, sortOrder: number) {
  const [image] = await db
    .update(productImageTable)
    .set({ sortOrder })
    .where(eq(productImageTable.id, id))
    .returning()
  
  revalidatePath(`/admin/products/[id]`)
  return image
}