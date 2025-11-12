// src/hooks/admin/mutations/products/use-product-image-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProductImage } from '@/actions/admin/products/product-images/create'; // ← Import correto
import { deleteProductImage } from '@/actions/admin/products/product-images/delete'; // ← Import correto
import { updateProductImageOrder } from '@/actions/admin/products/product-images/update-order'; // ← Import correto

export const useProductImageMutations = () => {
  const queryClient = useQueryClient();

  const createImage = useMutation({
    mutationFn: createProductImage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-images', variables.productVariantId] 
      });
    },
  });

  const deleteImage = useMutation({
    mutationFn: deleteProductImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-images'] 
      });
    },
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) => 
      updateProductImageOrder(id, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-images'] 
      });
    },
  });

  return {
    createImage,
    deleteImage,
    updateOrder,
  };
};