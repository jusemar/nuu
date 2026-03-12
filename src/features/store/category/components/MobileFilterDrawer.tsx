// src/features/store/category/components/MobileFilterDrawer.tsx
'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CategoryFilter } from './CategoryFilter';

interface MobileFilterDrawerProps {
  activeFiltersCount?: number;
}

export function MobileFilterDrawer({ activeFiltersCount = 0 }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />    
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[65vw] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filtrar Produtos</SheetTitle>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100vh-80px)] pb-8">
          <CategoryFilter />
        </div>
      </SheetContent>
    </Sheet>
  );
}