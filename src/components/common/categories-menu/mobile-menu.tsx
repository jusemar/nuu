// components/common/categories-menu/mobile-menu.tsx
'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useCategories } from '@/providers/categories-provider-client';

export const MobileCategoriesMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const categories = useCategories();

  return (
    <div className="border-t mt-2 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
      >
        <span>Categorias</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {categories?.map((category) => (
            <a
              key={category.id}
              href={`/category/${category.slug}`}
              className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {category.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};