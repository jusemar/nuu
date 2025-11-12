"use server"

import { db } from "@/db"
import { productImageTable } from "@/db/schema"
import { revalidatePath } from "next/cache"

export async function createProductImage(data: {
  productVariantId: string
  imageUrl: string
  cloudinaryPublicId: string
  altText?: string
  sortOrder?: number
}) {
  const [image] = await db
    .insert(productImageTable)
    .values(data)
    .returning()
  
  revalidatePath(`/admin/products/[id]`)
  return image
}