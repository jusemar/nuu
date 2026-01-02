// src/features/products/api/queries/use-products-by-flag.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductsByFlag } from '../../actions/get-products-by-flag';

export function useProductsByFlag(flags: string[]) {
  return useQuery({
    queryKey: ['products', 'by-flag', ...flags],
    queryFn: () => getProductsByFlag(flags),
    // Opções adicionais:
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}