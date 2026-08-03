"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

interface TabItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface CategoryTabsProps {
  tabs: TabItem[];
}

export function CategoryTabs({ tabs }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!tabs.length) return null;

  return (
    <div className="w-full border-b border-gray-200/50 bg-white py-2 sm:py-3 md:py-4">
      <div className="flex w-full items-center gap-1 px-2 sm:gap-2 sm:px-3 md:gap-3 md:px-4">
        {/* SETA ESQUERDA - SEMPRE visível */}
        <button
          onClick={() => scroll("left")}
          className="z-10 flex-shrink-0 rounded-full border border-gray-200 bg-white p-2 shadow-md transition-colors hover:bg-gray-50 sm:p-2.5 md:p-3"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
        </button>

        {/* CONTAINER DAS TABS - flex-1 ocupa TODO espaço entre as setas */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="flex gap-2 sm:gap-3 md:gap-4">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/category/${tab.slug}`}
                className="flex flex-shrink-0 items-center gap-1 rounded-lg border-2 border-gray-200 bg-white px-3 py-1.5 transition-colors hover:border-blue-400 sm:gap-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5"
              >
                <span className="text-xs font-medium whitespace-nowrap sm:text-sm md:text-base">
                  {tab.name}
                </span>
                {tab.count && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs whitespace-nowrap">
                    {tab.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* SETA DIREITA - SEMPRE visível */}
        <button
          onClick={() => scroll("right")}
          className="z-10 flex-shrink-0 rounded-full border border-gray-200 bg-white p-2 shadow-md transition-colors hover:bg-gray-50 sm:p-2.5 md:p-3"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
