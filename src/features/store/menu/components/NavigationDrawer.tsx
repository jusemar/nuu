'use client';

import { useState } from 'react';
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
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// =====================================================================
// COMPONENTE RECURSIVO: CategoryTree
// =====================================================================
// Renderiza a árvore de categorias com boas práticas de UX:
// - Seta só aparece se tiver filhos
// - Ícones diferentes para pastas e itens
// - Indentação clara
// - Feedback visual no hover
// =====================================================================
const CategoryTree = ({ 
  categories, 
  depth = 0,
  onItemClick 
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

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedItems.has(category.id);

        return (
          <div key={category.id} className="select-none">
            {/* Container da linha */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                "hover:bg-gray-100 group cursor-pointer",
                depth === 0 && "font-medium"
              )}
              style={{ marginLeft: `${depth * 20}px` }}
            >
              {/* Botão de expandir - só aparece se tiver filhos */}
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(category.id, e)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0"
                  aria-label={isExpanded ? "Recolher" : "Expandir"}
                >
                  <ChevronRight
                    size={16}
                    className={cn(
                      "text-gray-500 transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
              ) : (
                // Espaço vazio para alinhar itens sem botão
                <div className="w-6 flex-shrink-0" />
              )}

              {/* Link da categoria */}
              <a
                href={`/categoria/${category.slug}`}
                onClick={onItemClick}
                className="flex-1 flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                {/* Ícone: pasta para categorias com filhos, tag para sem filhos */}
                {hasChildren ? (
                  <Folder 
                    size={16} 
                    className="text-amber-500 flex-shrink-0" 
                  />
                ) : (
                  <Tag 
                    size={16} 
                    className="text-slate-400 flex-shrink-0" 
                  />
                )}
                
                {/* Nome da categoria */}
                <span className="text-sm truncate">
                  {category.name}
                </span>

                {/* Badge com quantidade de filhos (opcional - boa prática) */}
                {hasChildren && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {category.children.length}
                  </span>
                )}
              </a>
            </div>

            {/* Subcategorias (renderizadas recursivamente) */}
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

  // =====================================================================
  // CONTEÚDO DO MENU
  // =====================================================================
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
        <CategoryTree 
          categories={categories} 
          depth={0}
          onItemClick={onClose}
        />
      </div>
    );
  };

  // =====================================================================
  // VERSÃO MOBILE: Drawer
  // =====================================================================
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

  // =====================================================================
  // VERSÃO DESKTOP: Sheet
  // =====================================================================
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