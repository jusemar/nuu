"use server"

import { db } from "@/db/connection"
import { productImageTable } from "@/db/schema"
import { revalidatePath } from "next/cache"

export async function createProductImage(data: {
  productVariantId: string
  imageUrl: string
  cloudinaryPublicId: string
  altText?: string
  sortOrder?: number
}) {
  console.log('Dados recebidos na action createProductImage:', data)
  
  const [image] = await db
    .insert(productImageTable)
    .values({
      productVariantId: data.productVariantId,
      imageUrl: data.imageUrl,
      externalImageId: data.cloudinaryPublicId,
      altText: data.altText,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning()
  
  revalidatePath(`/admin/products/[id]`)
  return image
}
