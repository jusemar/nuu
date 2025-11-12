"use server"

import { db } from "@/db"
import { productImageTable } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export async function getProductImages(variantId: string) {
  return db
    .select()
    .from(productImageTable)
    .where(eq(productImageTable.productVariantId, variantId))
    .orderBy(asc(productImageTable.sortOrder))
}