// src/hooks/admin/queries/products/use-product-images.ts
import { useQuery } from '@tanstack/react-query';
import { getProductImages } from '@/actions/admin/products/product-images/get'; // ← Import correto

export const useProductImages = (variantId: string | undefined) => {
  return useQuery({
    queryKey: ['product-images', variantId],
    queryFn: () => getProductImages(variantId!),
    enabled: !!variantId,
  });
};