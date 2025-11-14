'use server'

import { db } from '@/db'
import { productTable, productGalleryImagesTable } from '@/db/schema'
import { revalidatePath } from 'next/cache'





interface CreateProductData {
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

    // 2. Adicionar imagens na galeria (se houver)
    if (data.images.length > 0) {
      await db.insert(productGalleryImagesTable).values(
        data.images.map((image, index) => ({
          productId: product.id,
          imageUrl: image.url,
          altText: image.altText || data.name,
          isPrimary: image.isPrimary,
          sortOrder: index,
        }))
      )
    }

    // 3. Revalidar cache
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