// components/common/categories-menu/wrapper.tsx
import { getCategories } from '@/data/categories/get';
import { CategoriesMenu } from './index';

export const CategoriesMenuWrapper = async () => {
  const categories = await getCategories();
  
  // Garante que categories seja um array
  return <CategoriesMenu categories={categories || []} />;
};