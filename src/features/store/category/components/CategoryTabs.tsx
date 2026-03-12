'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TabItem {
  id: string;
  name: string;
  count?: number;
}

interface CategoryTabsProps {
  tabs: TabItem[];
}

export function CategoryTabs({ tabs }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!tabs.length) return null;

  return (
    <div className="w-full bg-white border-b border-gray-200/50 py-2 sm:py-3 md:py-4">
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 w-full px-2 sm:px-3 md:px-4">
        
        {/* SETA ESQUERDA - SEMPRE visível */}
        <button
          onClick={() => scroll('left')}
          className="flex-shrink-0 p-2 sm:p-2.5 md:p-3 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 z-10 transition-colors"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>

        {/* CONTAINER DAS TABS - flex-1 ocupa TODO espaço entre as setas */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scroll-smooth"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex gap-2 sm:gap-3 md:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="flex-shrink-0 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors flex items-center gap-1 sm:gap-2"
              >
                <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">
                  {tab.name}
                </span>
                {tab.count && (
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SETA DIREITA - SEMPRE visível */}
        <button
          onClick={() => scroll('right')}
          className="flex-shrink-0 p-2 sm:p-2.5 md:p-3 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 z-10 transition-colors"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
