// =====================================================================
// SERVICE: productImageGalleryService
// =====================================================================
// Local: src/features/admin/products/service/productImageGalleryService.ts
// 
// FUNÇÃO: Buscar imagens da galeria de um produto específico
// 
// Uso: Usado na página de edição de produto para carregar as imagens
// salvas na tabela product_gallery_images
// =====================================================================

'use server'

import { db } from '@/db'
import { productGalleryImagesTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

// =====================================================================
// TIPO: GalleryImage
// =====================================================================
// Representa uma imagem da galeria do produto
// - imageUrl: URL da imagem no storage
// - isPrimary: se é a imagem principal (aparece primeiro)
// - sortOrder: ordem de exibição
// =====================================================================
export interface GalleryImage {
  id: string
  imageUrl: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
  productId: string
  createdAt: Date
}

// =====================================================================
// FUNÇÃO: getProductGalleryImages
// =====================================================================
// Busca todas as imagens da galeria de um produto
// Ordenadas por sortOrder (menor primeiro)
// 
// @param productId - ID do produto
// @returns Array de imagens ou array vazio em caso de erro
// =====================================================================
export async function getProductGalleryImages(productId: string): Promise<GalleryImage[]> {
  try {
    // Busca imagens na tabela product_gallery_images
    const images = await db
      .select()
      .from(productGalleryImagesTable)
      .where(eq(productGalleryImagesTable.productId, productId))
      .orderBy(productGalleryImagesTable.sortOrder)
    
   return images.map(img => ({
  ...img,
  isPrimary: img.isPrimary ?? false, // null vira false
  sortOrder: img.sortOrder ?? 0       // null vira 0
}))

  } catch (error) {
    console.error('Erro ao buscar imagens da galeria:', error)
    return []
  }
}