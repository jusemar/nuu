'use server'

import { db } from '@/db'
import { productTable, productGalleryImagesTable, productPricingTable } from '@/db/schema'
import { revalidatePath } from 'next/cache'

interface CreateProductData {
  name: string
  slug: string
  description: string
  cardShortText: string
  categoryId: string
  brand?: string
  sku: string
  productType?: string
  productCode?: string
  ncmCode?: string
  collection?: string
  tags?: string[]
  storeProductFlags?: string[]
  pricing?: {
    costPrice?: string
    modalities?: any
    mainCardPriceType?: string
  }
  warranty?: {
    period?: string
    provider?: string
    terms?: string
  }
  
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
  
  
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
      storeProductFlags: data.storeProductFlags || [],     
      cardShortText: data.cardShortText, 
      costPrice: data.pricing?.costPrice ? parseInt(data.pricing.costPrice) * 100 : null,
      warrantyPeriod: data.warranty?.period ? parseInt(data.warranty.period) : null,
      warrantyProvider: data.warranty?.provider,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl, 
      
      status: 'draft',
      isActive: true,
    }).returning()
    console.log('Produto criado:', product);

    // 2. Adicionar imagens na galeria
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

    // 3. SALVAR MODALIDADES DE PREÇO (apenas texto descritivo)
    if (data.pricing?.modalities) {
      const pricingEntries = Object.entries(data.pricing.modalities).map(([type, modality]: [string, any]) => ({
        productId: product.id,
        type: type,
        price: modality.price ? parseInt(modality.price) * 100 : 0,
        deliveryDays: modality.deliveryText || '',
        pricingModalDescription: modality.deliveryText || '',

        mainCardPrice: data.pricing?.mainCardPriceType === type,
        
        isActive: true,
      }))

      if (pricingEntries.length > 0) {
        await db.insert(productPricingTable).values(pricingEntries)
      }
    }



    // 4. Revalidar cache
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