// components/common/categories-menu/index.tsx (CLIENT)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesMenuProps {
  categories: Category[];
}

export const CategoriesMenu = ({ categories }: CategoriesMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1">
          Categorias
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ScrollArea className="h-96">
          <div className="p-2">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {category.name}
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};