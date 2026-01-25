'use client';

import { X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Eletrônicos',
    subcategories: ['Celulares', 'Notebooks', 'Tablets', 'Acessórios'],
  },
  {
    id: '2',
    name: 'Moda',
    subcategories: ['Masculino', 'Feminino', 'Infantil', 'Sapatos'],
  },
  {
    id: '3',
    name: 'Casa e Jardim',
    subcategories: ['Móveis', 'Decoração', 'Cozinha', 'Utensílios'],
  },
  {
    id: '4',
    name: 'Esportes',
    subcategories: ['Roupas', 'Equipamentos', 'Calçados', 'Acessórios'],
  },
];

export function NavigationDrawer({ isOpen, onClose }: DrawerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      {/* Overlay - mais claro em desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black z-50 transition-opacity duration-300"
          style={{ 
            opacity: isOpen ? 0.5 : 0,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
          onClick={onClose}
        />
      )}

      {/* Drawer - funciona em todas as telas */}
      <div
        className={`fixed top-0 left-0 h-screen w-80 bg-white shadow-xl z-60 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-900">Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Categories Scroll */}
        <div className="overflow-y-auto h-[calc(100vh-70px)]">
          {categories.map((category) => (
            <div key={category.id} className="border-b border-gray-100">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              >
                <span className="text-gray-900 font-medium">{category.name}</span>
                <ChevronRight
                  size={18}
                  className={`text-gray-500 transition-transform ${
                    expandedCategory === category.id ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Subcategories */}
              {expandedCategory === category.id && (
                <div className="bg-gray-50">
                  {category.subcategories.map((subcategory) => (
                    <a
                      key={subcategory}
                      href="#"
                      className="block px-8 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition text-sm"
                    >
                      {subcategory}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}