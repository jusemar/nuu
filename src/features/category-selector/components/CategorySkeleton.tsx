'use client';

import Link from 'next/link';
import { CategorySelectorProps } from '../types';

// Mapeamento de categorias para ícones profissionais
const categoryIcons: Record<string, string> = {
  eletronicos: '⚡',
  eletronico: '⚡',
  moda: '👔',
  casa: '🏠',
  beleza: '💄',
  esportes: '⚽',
  livros: '📚',
  colchao: '🛏️',
  colchões: '🛏️',
  moveis: '🛋️',
  móveis: '🛋️',
  alimentos: '🍎',
  alimento: '🍎',
  bebes: '👶',
  bebe: '👶',
  brinquedos: '🧸',
  brinquedo: '🧸',
  saude: '💊',
  automotivo: '🚗',
  jardinagem: '🌱',
  ferramenta: '🔧',
  ferramentas: '🔧',
  esporte: '⚽',
  maquiagem: '💄',
  perfumaria: '🧴',
  cama: '🛏️',
  banho: '🛁',
  cozinha: '🍳',
};

// Função para obter ícone da categoria
function getCategoryIcon(slug: string): string {
  const normalizedSlug = slug.toLowerCase();
  return categoryIcons[normalizedSlug] || '🛍️';
}

// Componente de Skeleton para carregamento
function CategorySkeletonComponent() {
  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 mx-auto mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
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
  onCategorySelect 
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
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Explore por Categorias
        </h2>
      </div>

      <div className="relative">
        <div className="pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 w-full">
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;

              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  onClick={() => handleClick(category.slug)}
                  className={`
                    group relative flex flex-col items-center justify-center
                    rounded-lg px-4 py-4 transition-all duration-300 ease-out
                    border border-gray-200 dark:border-gray-700
                    min-w-fit
                    ${isActive 
                      ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/30 scale-105' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-gray-700 dark:hover:border-blue-600'
                    }
                    hover:shadow-md hover:-translate-y-0.5 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Ir para categoria ${category.name}`}
                >
                  {category.productCount !== undefined && (
                    <span className={`
                      absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full
                      ${isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}
                    `}>
                      {category.productCount}
                    </span>
                  )}

                  <span className={`
                    font-bold text-center leading-tight break-words min-h-fit text-lg
                    ${isActive 
                      ? 'text-white' 
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400'
                    }
                  `}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="md:hidden flex justify-center mt-6 gap-3">
          <button 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            aria-label="Rolar para esquerda"
          >
            ←
          </button>
          <button 
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            aria-label="Rolar para direita"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}