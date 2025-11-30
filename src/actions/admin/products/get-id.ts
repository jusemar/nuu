"use server"

import { db } from "@/db"
import {
  productTable,
  productPricingTable,
  productImageTable,
  categoryTable,
} from "@/db/schema"
import { eq } from "drizzle-orm"

function col(table: any, ...names: string[]) {
  for (const n of names) {
    if (n in table) return (table as any)[n]
  }
  return undefined
}

function val(obj: any, ...names: string[]) {
  for (const n of names) {
    if (n in obj && obj[n] !== undefined) return obj[n]
  }
  return undefined
}

export async function getProduct(id: string) {
  try {
    // Buscar produto com TODOS os campos necessários
    const [product] = await db
      .select({
        // Campos básicos
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        description: productTable.description,
        cardShortText: productTable.cardShortText,
        brand: productTable.brand,
        sku: productTable.sku,
        isActive: productTable.isActive,
        collection: productTable.collection,
        tags: productTable.tags,
        
        // Códigos do produto (CAMPOS NOVOS)
        productType: productTable.productType,
        productCode: productTable.productCode,
        ncmCode: productTable.ncmCode,
        
        // Store Product Flags
        storeProductFlags: productTable.storeProductFlags,
        
        // Status
        status: productTable.status,
        
        // Preços (CAMPOS NOVOS)
        costPrice: productTable.costPrice,
        salePrice: productTable.salePrice,
        promoPrice: productTable.promoPrice,
        taxRate: productTable.taxRate,
        
        // Dimensões e frete (CAMPOS NOVOS)
        weight: productTable.weight,
        length: productTable.length,
        width: productTable.width,
        height: productTable.height,
        hasFreeShipping: productTable.hasFreeShipping,
        hasLocalPickup: productTable.hasLocalPickup,
        
        // Garantia (CAMPOS NOVOS)
        warrantyPeriod: productTable.warrantyPeriod,
        warrantyProvider: productTable.warrantyProvider,
        
        // Vendedor (CAMPOS NOVOS)
        sellerCode: productTable.sellerCode,
        internalCode: productTable.internalCode,
        sellerInfo: productTable.sellerInfo,
        
        // SEO (CAMPOS NOVOS)
        metaTitle: productTable.metaTitle,
        metaDescription: productTable.metaDescription,
        canonicalUrl: productTable.canonicalUrl,
        
        // Categoria
        categoryId: productTable.categoryId,
        categoryName: categoryTable.name,
        
        // Controle
        createdAt: productTable.createdAt,
        updatedAt: productTable.updatedAt,
      })
      .from(productTable)
      .leftJoin(categoryTable, eq(categoryTable.id, productTable.categoryId))
      .where(eq(productTable.id, id))
      .limit(1)

    if (!product) {
      return { success: false, message: "Produto não encontrado", data: null }
    }

    // ... restante do código permanece igual para images e pricing ...
    const imageFk = col(productImageTable, "product_id", "productId")
    const imageUrlCol = col(productImageTable, "image_url", "imageUrl", "url")
    const imagePrimaryCol = col(productImageTable, "is_primary", "isPrimary")
    const imageVariantCol = col(productImageTable, "product_variant_id", "productVariantId", "variant_id")

    const imagesSelect: Record<string, any> = { id: productImageTable.id }
    if (imageUrlCol) imagesSelect.url = imageUrlCol
    if (imagePrimaryCol) imagesSelect.isPrimary = imagePrimaryCol
    if (imageVariantCol) imagesSelect.variantId = imageVariantCol

    const images = imageFk
      ? await db.select(imagesSelect).from(productImageTable).where(eq(imageFk, id))
      : []

    const priceFk = col(productPricingTable, "product_id", "productId")
    const pricingModalities = priceFk
      ? await db.select().from(productPricingTable).where(eq(priceFk, id))
      : []

    const modalities: Record<string, any> = {}
    let mainCardPriceType = ""
    pricingModalities.forEach((m: any) => {
      const type = val(m, "type", "price_type", "priceType") || "default"
      const priceRaw = val(m, "price", "price_in_cents", "priceInCents")
      const price = priceRaw ? Number(priceRaw) / 100 : 0
      const deliveryText = val(m, "delivery_days", "deliveryDays") || ""
      const promoActive = Boolean(val(m, "hasPromo", "has_promo", "promo_active"))
      const promoPriceRaw = val(m, "promoPrice", "promo_price", "promo_price_in_cents")
      const promoPrice = promoPriceRaw ? Number(promoPriceRaw) / 100 : undefined
      const promoType = val(m, "promoType", "promo_type") || "normal"
      const promoEndDate = val(m, "promoEndDate", "promo_end_date") || undefined

      modalities[type] = {
        price: price.toFixed(2),
        deliveryText,
        promo: {
          active: promoActive,
          type: promoType,
          price: promoPrice ? promoPrice.toFixed(2) : "",
          endDate: promoEndDate,
        },
      }
      if (val(m, "mainCardPrice", "main_card_price")) mainCardPriceType = type
    })

    // Processar storeProductFlags
    let flags: string[] = []
    if (product.storeProductFlags) {
      try {
        flags =
          typeof product.storeProductFlags === "string"
            ? JSON.parse(product.storeProductFlags)
            : (product.storeProductFlags as any)
      } catch {
        flags = Array.isArray(product.storeProductFlags) ? product.storeProductFlags : []
      }
    }

    // Processar tags
    let tags: string[] = []
    if (product.tags) {
      try {
        tags = typeof product.tags === "string" ? JSON.parse(product.tags) : product.tags
      } catch {
        tags = Array.isArray(product.tags) ? product.tags : []
      }
    }

    // Normalizar imagens
    const normalizedImages = (images || []).map((img: any) => ({
      id: img.id,
      url: val(img, "url", "image_url", "imageUrl"),
      isPrimary: val(img, "isPrimary", "is_primary", "primary") || false,
      variantId: val(img, "variantId", "product_variant_id", "productVariantId"),
    }))

    return {
      success: true,
      message: "Produto encontrado com sucesso",
      data: {
        ...product,
        tags,
        storeProductFlags: flags,
        images: normalizedImages,
        pricing: { modalities, mainCardPriceType },
      },
    }
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error)
    return { success: false, message: "Erro interno ao buscar produto", data: null }
  }
}