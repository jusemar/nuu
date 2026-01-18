'use client';

import { useQuery } from '@tanstack/react-query';
import { Category } from '@/features/category-selector/types';
// Função simulada - você vai substituir pela sua implementação real
async function fetchCategories(): Promise<Category[]> {
  // TODO: Substituir pela sua API real
  // Exemplo:
  // const response = await fetch('/api/categories');
  // return response.json();
  
  // Dados de exemplo
  return [
    { id: '1', name: 'Eletrônicos', slug: 'eletronicos', productCount: 42 },
    { id: '2', name: 'Moda', slug: 'moda', productCount: 28 },
    { id: '3', name: 'Casa', slug: 'casa', productCount: 35 },
    { id: '4', name: 'Beleza', slug: 'beleza', productCount: 19 },
    { id: '5', name: 'Esportes', slug: 'esportes', productCount: 23 },
    { id: '6', name: 'Livros', slug: 'livros', productCount: 56 },
  ];
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });
}