'use client';

import { createContext, useContext } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CategoriesContext = createContext<Category[]>([]);

interface CategoriesProviderClientProps {
  categories: Category[];
  children: React.ReactNode;
}

export const CategoriesProviderClient = ({ 
  categories, 
  children 
}: CategoriesProviderClientProps) => {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);