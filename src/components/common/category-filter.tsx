// src/components/common/category-filter.tsx
'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Layers, Tag, Gauge, Star } from 'lucide-react';

// Interface para os filtros
interface Filters {
  categories: string[];
  priceRange: [number, number];
  rating: string;
}

// Componente de Acordeão estilizado
function FilterAccordion({
  icon: Icon,
  label,
  iconColor,
  isOpen,
  onToggle,
  children
}: {
  icon: React.ElementType;
  label: string;
  iconColor: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-${iconColor}-100 to-${iconColor}-50 group-hover:from-${iconColor}-200 group-hover:to-${iconColor}-100 transition-all duration-300`}>
            <Icon className={`w-4 h-4 text-${iconColor}-600`} />
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">
            {label}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className={`px-4 pt-2 pb-4 space-y-3 border-l-2 border-${iconColor}-100 ml-7`}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Checkbox estilizado
function FilterCheckbox({
  id,
  label,
  checked,
  onChange
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 group/item cursor-pointer">
      <div className="relative">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className="w-5 h-5 rounded-lg border-2 border-gray-200 transition-all duration-300 group-hover/item:border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      </div>
      <Label
        htmlFor={id}
        className="text-sm text-gray-700 cursor-pointer font-medium transition-colors duration-300 group-hover/item:text-gray-900 flex-1"
      >
        {label}
      </Label>
      {checked && (
        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 animate-pulse" />
      )}
    </div>
  );
}

export const CategoryFilter = () => {
  // Estados dos filtros
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceRange: [0, 10000],
    rating: 'all'
  });

  // Estados dos acordeões
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: false,
    rating: false
  });

  // Exemplo de categorias (depois vira props ou vem do banco)
  const categories = [
    { id: "1", name: "Eletrônicos" },
    { id: "2", name: "Smartphones" },
    { id: "3", name: "Acessórios" },
    { id: "4", name: "Informática" },
  ];

  // Contador de filtros ativos
  const activeFiltersCount = 
    filters.categories.length + 
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000 ? 1 : 0) +
    (filters.rating !== 'all' ? 1 : 0);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId as keyof typeof prev]
    }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId)
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number]
    }));
  };

  const handleRatingChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      rating: value
    }));
  };

  const formatPrice = (price: number) => {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2">
      <div className="space-y-1">
        {/* Header com título e contador */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Filtrar Produtos
            </h2>
            {activeFiltersCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Refine sua busca com os filtros abaixo</p>
        </div>

        <div className="space-y-1">
          {/* Seção de Categorias */}
          <FilterAccordion
            icon={Layers}
            label="Categorias"
            iconColor="blue"
            isOpen={expandedSections.category}
            onToggle={() => toggleSection('category')}
          >
            {categories.map((category) => (
              <FilterCheckbox
                key={category.id}
                id={`category-${category.id}`}
                label={category.name}
                checked={filters.categories.includes(category.id)}
                onChange={(checked) => handleCategoryChange(category.id, checked)}
              />
            ))}
          </FilterAccordion>

          {/* Seção de Preço */}
          <div className="group mt-2">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 transition-all duration-300">
                  <Gauge className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold text-gray-900 text-sm tracking-tight">
                  Faixa de Preço
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                  expandedSections.price ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.price ? 'max-h-64' : 'max-h-0'
              }`}
            >
              <div className="px-4 pt-4 pb-4 space-y-4 border-l-2 border-green-100 ml-7">
                <div className="space-y-3">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={handlePriceChange}
                    min={0}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Mínimo</p>
                      <p className="text-sm font-bold text-gray-900">
                        R$ {formatPrice(filters.priceRange[0])}
                      </p>
                    </div>
                    <div className="text-gray-300">—</div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-600 mb-1">Máximo</p>
                      <p className="text-sm font-bold text-gray-900">
                        R$ {formatPrice(filters.priceRange[1])}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Avaliação */}
          <div className="group mt-2">
            <button
              onClick={() => toggleSection('rating')}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-50 group-hover:from-yellow-200 group-hover:to-yellow-100 transition-all duration-300">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-gray-900 text-sm tracking-tight">
                  Avaliação
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                  expandedSections.rating ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.rating ? 'max-h-80' : 'max-h-0'
              }`}
            >
              <div className="px-4 pt-2 pb-4 space-y-3 border-l-2 border-yellow-100 ml-7">
                <RadioGroup value={filters.rating} onValueChange={handleRatingChange}>
                  <div className="flex items-center gap-3 group/item cursor-pointer py-2">
                    <RadioGroupItem value="all" id="rating-all" />
                    <Label
                      htmlFor="rating-all"
                      className="text-sm text-gray-700 cursor-pointer font-medium flex-1"
                    >
                      Todas as avaliações
                    </Label>
                  </div>

                  {[4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center gap-3 group/item cursor-pointer py-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label
                        htmlFor={`rating-${rating}`}
                        className="text-sm text-gray-700 cursor-pointer font-medium flex-1 flex items-center gap-2"
                      >
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 transition-all duration-300 ${
                                i < rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200 group-hover/item:fill-yellow-200 group-hover/item:text-yellow-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">ou mais</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        {activeFiltersCount > 0 && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => setFilters({
                categories: [],
                priceRange: [0, 10000],
                rating: 'all'
              })}
              className="w-full py-2.5 px-4 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Limpar filtros</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full group-hover:bg-gray-300">
                {activeFiltersCount}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};