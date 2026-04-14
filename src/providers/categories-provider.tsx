// src/providers/categories-provider.tsx
// 
// Provider do lado do servidor (Server Component)
// Busca as categorias com tratamento de erro para não quebrar a aplicação

import { getCategories } from '@/data/categories/get';
import { CategoriesProviderClient } from './categories-provider-client';

interface CategoriesProviderProps {
  children: React.ReactNode;
}

export const CategoriesProvider = async ({ children }: CategoriesProviderProps) => {
  // Tenta buscar as categorias, mas se falhar, retorna array vazio
  // Isso impede que o erro derrube toda a aplicação
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  
  try {
    categories = await getCategories();
  } catch (error) {
    console.error('Erro ao buscar categorias no provider:', error);
    // Mantém categories como array vazio - não lança o erro
    // O site continua funcionando, apenas sem categorias
  }
  
  return (
    <CategoriesProviderClient categories={categories}>
      {children}
    </CategoriesProviderClient>
  );
};