// src/features/store/menu/components/NavigationDrawer.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Folder, Tag } from 'lucide-react';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { useHeader } from '@/features/header/hooks/useHeader';
import { cn } from '@/lib/utils';

// Componentes do shadcn
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// =====================================================================
// COMPONENTE RECURSIVO: CategoryTree
// =====================================================================
// Regras de navegação:
// - Nível 0 (raiz)              → expande no sheet, NÃO redireciona
// - Nível 1 (subcategoria)       → redireciona para PLP
// - Nível 2 (filha do nível 1)   → redireciona para PLP
// =====================================================================
const CategoryTree = ({
  categories,
  depth = 0,
  onItemClick,
}: {
  categories: any[];
  depth?: number;
  onItemClick?: () => void;
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Função que decide o que fazer ao clicar no item
  const handleItemClick = (
    e: React.MouseEvent,
    category: any,
    currentDepth: number
  ) => {
    // Nível 0 (raiz) com filhos → apenas expande, não redireciona
    if (currentDepth === 0 && category.children?.length > 0) {
      e.preventDefault();      // impede o Link de navegar
      toggleExpand(category.id, e);
      return;
    }

    // Para níveis 1, 2 ou qualquer item sem filhos → redireciona
    // O onItemClick fecha o menu após a navegação (boa prática)
    if (onItemClick) {
      // Pequeno delay para dar tempo de ver o feedback visual
      setTimeout(() => onItemClick(), 100);
    }
    // O Link do Next cuidará da navegação
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedItems.has(category.id);
        const isRootLevel = depth === 0;

        // Define se o item deve ser um Link ou um botão de expansão
        const shouldRenderAsLink =
          !(isRootLevel && hasChildren); // apenas raiz com filhos não vira link

        const content = (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
              'hover:bg-gray-100 group cursor-pointer',
              depth === 0 && 'font-medium',
              // feedback visual para raiz que só expande
              isRootLevel && hasChildren && 'cursor-default'
            )}
            style={{ marginLeft: `${depth * 20}px` }}
          >
            {/* Botão de expandir (só para raiz com filhos) */}
            {hasChildren ? (
              <button
                onClick={(e) => toggleExpand(category.id, e)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0"
                aria-label={isExpanded ? 'Recolher' : 'Expandir'}
              >
                <ChevronRight
                  size={16}
                  className={cn(
                    'text-gray-500 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>
            ) : (
              <div className="w-6 flex-shrink-0" />
            )}

            {/* Ícone e nome da categoria */}
            <div className="flex-1 flex items-center gap-2 text-gray-700">
              {hasChildren ? (
                <Folder size={16} className="text-amber-500 flex-shrink-0" />
              ) : (
                <Tag size={16} className="text-slate-400 flex-shrink-0" />
              )}
              <span className="text-sm truncate">{category.name}</span>
              {hasChildren && (
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {category.children.length}
                </span>
              )}
            </div>
          </div>
        );

        // Se for para renderizar como Link (todos exceto raiz com filhos)
        if (shouldRenderAsLink) {
          return (
            <div key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                onClick={(e) => handleItemClick(e, category, depth)}
                className="block"
              >
                {content}
              </Link>

              {/* Subcategorias (se expandidas) */}
              {hasChildren && isExpanded && (
                <div className="mt-1">
                  <CategoryTree
                    categories={category.children}
                    depth={depth + 1}
                    onItemClick={onItemClick}
                  />
                </div>
              )}
            </div>
          );
        }

        // Caso contrário (raiz com filhos) → só expande, sem Link
        return (
          <div key={category.id}>
            <div onClick={(e) => toggleExpand(category.id, e)}>{content}</div>

            {/* Subcategorias (se expandidas) */}
            {hasChildren && isExpanded && (
              <div className="mt-1">
                <CategoryTree
                  categories={category.children}
                  depth={depth + 1}
                  onItemClick={onItemClick}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL: NavigationDrawer
// =====================================================================
export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const { isMobile } = useHeader();
  const { data: categories, isLoading, error } = useMenuCategories();

  const MenuContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center text-red-600">
          Erro ao carregar categorias. Tente novamente.
        </div>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          Nenhuma categoria encontrada.
        </div>
      );
    }

    return (
      <div className="overflow-y-auto h-full pb-8">
        <CategoryTree categories={categories} depth={0} onItemClick={onClose} />
      </div>
    );
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader className="border-b border-gray-200">
            <DrawerTitle className="font-bold text-lg text-gray-900">
              Categorias
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2 overflow-y-auto">
            <MenuContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 sm:w-96 p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="font-bold text-lg text-gray-900">
            Categorias
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          <MenuContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}