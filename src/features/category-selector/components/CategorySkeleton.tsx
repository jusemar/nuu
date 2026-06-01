"use client";

import Link from "next/link";
import { CategorySelectorProps } from "../types";

// Componente de Skeleton para carregamento
function CategorySkeletonComponent() {
  return (
    <div className="w-full">
      <div className="mb-5">
        <div className="bg-muted mb-3 h-7 w-56 animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="border-border bg-muted h-20 animate-pulse rounded-xl border"
          >
            <span className="sr-only">Carregando categoria</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente Principal - CategorySelector
export function CategorySelector({
  categories,
  activeCategory,
  isLoading = false,
  onCategorySelect,
}: CategorySelectorProps) {
  if (isLoading) {
    return <CategorySkeletonComponent />;
  }

  const handleClick = (slug: string) => {
    if (onCategorySelect) {
      onCategorySelect(slug);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-foreground text-xl leading-tight font-bold tracking-tight sm:text-2xl">
          Explore por Categorias
        </h2>
        <div className="bg-border hidden h-px flex-1 sm:block" />
      </div>

      <div className="relative">
        <div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;

              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  onClick={() => handleClick(category.slug)}
                  className={`group hover:shadow-elevation focus:ring-primary relative flex min-h-20 flex-col justify-center rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-elevation"
                      : "border-border bg-card text-foreground hover:border-primary/25 hover:bg-primary-light"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Ir para categoria ${category.name}`}
                >
                  {category.productCount !== undefined && (
                    <span
                      className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-primary-light text-primary"
                      }`}
                    >
                      {category.productCount}
                    </span>
                  )}

                  <span className="pr-8 text-sm leading-snug font-semibold break-words sm:text-base">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
