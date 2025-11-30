"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { productTable, productPricingTable, productGalleryImagesTable } from "@/db/schema"
import { eq } from "drizzle-orm"

interface UpdateProductData {
  name?: string
  slug?: string
  description?: string
  cardShortText?: string
  categoryId?: string
  brand?: string
  sku?: string
  isActive?: boolean
  collection?: string
  tags?: string[]
  storeProductFlags: string[]
  productType?: string
  productCode?: string
  ncmCode?: string
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  
  pricing?: {
    costPrice?: string
    modalities?: Record<string, any>
    mainCardPriceType?: string
  }
  warranty?: {
    period?: string
    provider?: string
    terms?: string
  }
  images?: Array<{
    url: string
    isPrimary: boolean
    altText?: string
  }>
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

    // ✅ CONSTRUIR APENAS CAMPOS QUE FORAM ENVIADOS
    const updateFields: any = {
      updatedAt: new Date() // Sempre atualiza
    }

    // Apenas adiciona campos que foram explicitamente enviados
    if (data.name !== undefined) updateFields.name = data.name
    if (data.slug !== undefined) updateFields.slug = data.slug
    if (data.description !== undefined) updateFields.description = data.description
    if (data.cardShortText !== undefined) updateFields.cardShortText = data.cardShortText
    if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId
    if (data.brand !== undefined) updateFields.brand = data.brand
    if (data.sku !== undefined) updateFields.sku = data.sku
    if (data.isActive !== undefined) updateFields.isActive = data.isActive
    if (data.collection !== undefined) updateFields.collection = data.collection
    if (data.tags !== undefined) updateFields.tags = data.tags
    if (data.productType !== undefined) updateFields.productType = data.productType
    if (data.productCode !== undefined) updateFields.productCode = data.productCode
    if (data.ncmCode !== undefined) updateFields.ncmCode = data.ncmCode
    if (data.storeProductFlags !== undefined) updateFields.storeProductFlags = data.storeProductFlags
    if (data.metaTitle !== undefined) updateFields.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) updateFields.metaDescription = data.metaDescription
    if (data.canonicalUrl !== undefined) updateFields.canonicalUrl = data.canonicalUrl

    if (data.storeProductFlags !== undefined) updateFields.storeProductFlags = data.storeProductFlags

    // Campos com transformação
    if (data.pricing?.costPrice !== undefined) {
      updateFields.costPrice = data.pricing.costPrice ? 
        Math.round(parseFloat(data.pricing.costPrice) * 100) : null
    }
    if (data.warranty?.period !== undefined) {
      updateFields.warrantyPeriod = data.warranty.period ? 
        parseInt(data.warranty.period) : null
    }
    if (data.warranty?.provider !== undefined) {
      updateFields.warrantyProvider = data.warranty.provider
    }

    // ✅ ATUALIZAR APENAS SE HOUVER CAMPOS MODIFICADOS
    if (Object.keys(updateFields).length > 1) {
      await db
        .update(productTable)
        .set(updateFields)
        .where(eq(productTable.id, id))
    }

    // ✅ MODALIDADES DE PREÇO (apenas se modalities for fornecida)
    if (data.pricing?.modalities !== undefined) {
      await db.delete(productPricingTable).where(eq(productPricingTable.productId, id))

      const pricingEntries = Object.entries(data.pricing.modalities)
        .filter(([_, modality]) => modality.price)
        .map(([type, modality]: [string, any]) => ({
          productId: id,
          type: type,
          price: Math.round(parseFloat(modality.price) * 100),
          deliveryDays: modality.deliveryText || '',
          pricingModalDescription: modality.deliveryText || '',
          mainCardPrice: data.pricing?.mainCardPriceType === type,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }))

      if (pricingEntries.length > 0) {
        await db.insert(productPricingTable).values(pricingEntries)
      }
    }

    // ✅ IMAGENS (apenas se images for fornecida)
    if (data.images !== undefined) {
      await db.delete(productGalleryImagesTable).where(eq(productGalleryImagesTable.productId, id))

      if (data.images.length > 0) {
        const imageEntries = data.images.map((image, index) => ({
          productId: id,
          imageUrl: image.url,
          altText: image.altText || data.name || existingProduct.name,
          isPrimary: image.isPrimary,
          sortOrder: index,
          createdAt: new Date(),
          updatedAt: new Date()
        }))

        await db.insert(productGalleryImagesTable).values(imageEntries)
      }
    }

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