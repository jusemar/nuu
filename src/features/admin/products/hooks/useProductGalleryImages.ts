// =====================================================================
// HOOK: useProductGalleryImages
// =====================================================================
// Local: src/features/admin/products/hooks/useProductGalleryImages.ts
// 
// FUNÇÃO: Hook React Query para buscar imagens da galeria do produto
// 
// Uso: 
//   const { data: images, isLoading } = useProductGalleryImages(productId)
// =====================================================================

import { useQuery } from '@tanstack/react-query'
import { getProductGalleryImages } from '../service/productImageGalleryService'

// =====================================================================
// Chave única para cache do React Query
// =====================================================================
// Formato: ['product-gallery-images', productId]
// Isso garante que cada produto tenha seu próprio cache
// =====================================================================
const GALLERY_IMAGES_KEY = 'product-gallery-images'

// =====================================================================
// HOOK: useProductGalleryImages
// =====================================================================
// @param productId - ID do produto (opcional)
// @returns Query com dados das imagens, loading e error
// =====================================================================
export function useProductGalleryImages(productId?: string) {
  return useQuery({
    queryKey: [GALLERY_IMAGES_KEY, productId],
    queryFn: async () => {
      if (!productId) return []
      return await getProductGalleryImages(productId)
    },
    enabled: !!productId, // Só executa se tiver productId
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}