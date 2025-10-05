import { getCategories } from '@/data/categories/get';
import { CategoriesProviderClient } from './categories-provider-client';

interface CategoriesProviderProps {
  children: React.ReactNode;
}

export const CategoriesProvider = async ({ children }: CategoriesProviderProps) => {
  const categories = await getCategories();
  
  return (
    <CategoriesProviderClient categories={categories}>
      {children}
    </CategoriesProviderClient>
  );
};