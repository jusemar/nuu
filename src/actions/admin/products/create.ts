// src/actions/admin/products/create.ts
'use server'

import { db } from '@/db'
import { productTable, productVariantTable, productImageTable } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface CreateProductData {
  // Dados básicos do produto
  name: string
  slug: string
  description: string
  categoryId: string
  brand?: string
  sku: string
  productType?: string
  productCode?: string
  ncmCode?: string
  collection?: string
  tags?: string[]
  
  // Imagens
  images: Array<{
    url: string
    isPrimary: boolean
    altText?: string
  }>
  
  // Variante padrão (obrigatória)
  variant: {
    sku: string
    priceInCents: number
    stockQuantity: number
    attributes?: Record<string, string>
  }
}

export async function createProduct(data: CreateProductData) {
  try {
    // 1. Criar o produto principal
    const [product] = await db.insert(productTable).values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      brand: data.brand,
      sku: data.sku,
      productType: data.productType,
      productCode: data.productCode,
      ncmCode: data.ncmCode,
      collection: data.collection,
      tags: data.tags,
      status: 'draft',
      isActive: true,
    }).returning()

    // 2. Criar variante padrão
    const [variant] = await db.insert(productVariantTable).values({
      productId: product.id,
      sku: data.variant.sku,
      name: data.name, // Nome inicial igual ao produto
      priceInCents: data.variant.priceInCents,
      stockQuantity: data.variant.stockQuantity,
      attributes: data.variant.attributes || {},
      isActive: true,
      isDefault: true, // Esta é a variante principal
    }).returning()

   
// 3. Adicionar imagens (se houver)
        if (data.images.length > 0) {
        await db.insert(productImageTable).values(
            data.images.map((image, index) => ({
            productVariantId: variant.id,
            imageUrl: image.url,
            altText: image.altText || data.name,
            sortOrder: image.isPrimary ? 0 : index + 1,
            externalImageId: `vercel-blob-${Date.now()}-${index}`, // ← AGORA OPCIONAL
            }))
        )
        }

    // 4. Revalidar cache e redirecionar
    revalidatePath('/admin/products')
    return { success: true, productId: product.id }
    
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return { 
      success: false, 
      error: 'Erro ao criar produto. Tente novamente.' 
    }
  }
}