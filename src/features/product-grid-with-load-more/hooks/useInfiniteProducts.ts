'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getProductsLoadMore } from '@/features/products/actions/get-products-load-more'

export function useProductsInfinite(initialPage: number = 1) {
  return useInfiniteQuery({
    queryKey: ['products', 'load-more'],
    queryFn: ({ pageParam = initialPage }) => 
      getProductsLoadMore(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: initialPage,
  });
}