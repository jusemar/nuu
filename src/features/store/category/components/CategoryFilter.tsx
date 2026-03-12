'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================================
// TIPO: Filters
// =====================================================================
interface Filters {
  categories: string[];
  brands: string[];
  sizes: string[];
  priceRange: [number, number];
  rating: string;
}

// =====================================================================
// COMPONENTE: FilterAccordion
// =====================================================================
function FilterAccordion({
  title,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = false,
  showSearch = false,
  searchPlaceholder = "Buscar...",
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-br transition-all duration-300",
            `from-${iconColor}-100 to-${iconColor}-50`,
            `group-hover:from-${iconColor}-200 group-hover:to-${iconColor}-100`
          )}>
            <Icon className={cn("w-4 h-4", `text-${iconColor}-600`)} />
          </div>
          <span>{title}</span>
        </div>
        
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="pb-4 space-y-3">
          {showSearch && (
            <div className="relative px-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pl-1 pr-2 space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// COMPONENTE: FilterCheckbox
// =====================================================================
function FilterCheckbox({
  id,
  label,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between group/item hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
        />
        <Label
          htmlFor={id}
          className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
        >
          {label}
        </Label>
      </div>
      
      {count !== undefined && (
        <span className="text-xs text-gray-400 group-hover/item:text-gray-600 transition-colors">
          ({count})
        </span>
      )}
      
      {checked && (
        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 animate-pulse" />
      )}
    </div>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL: CategoryFilter
// =====================================================================
export const CategoryFilter = () => {
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    brands: [],
    sizes: [],
    priceRange: [0, 1000],
    rating: 'all',
  });

  // =================================================================
  // DADOS FICTÍCIOS
  // =================================================================
  const categories = [
    { id: '1', name: 'Botas', count: 45 },
    { id: '2', name: 'Sapatilhas', count: 32 },
    { id: '3', name: 'Tênis', count: 78 },
    { id: '4', name: 'Sandálias', count: 23 },
    { id: '5', name: 'Scarpin', count: 18 },
    { id: '6', name: 'Mocassim', count: 15 },
    { id: '7', name: 'Oxford', count: 12 },
    { id: '8', name: 'Anabela', count: 9 },
  ];

  const brands = [
    { id: '1', name: 'Amanner', count: 12 },
    { id: '2', name: 'Anacapri', count: 18 },
    { id: '3', name: 'Andacco', count: 9 },
    { id: '4', name: 'Arezzo', count: 15 },
    { id: '5', name: 'Beira Rio', count: 22 },
    { id: '6', name: 'Capodarte', count: 8 },
    { id: '7', name: 'Cristófoli', count: 14 },
    { id: '8', name: 'Dijean', count: 11 },
    { id: '9', name: 'Dumond', count: 7 },
    { id: '10', name: 'Ferracini', count: 13 },
  ];

  const sizes = [
    { id: '33', name: '33', count: 5 },
    { id: '34', name: '34', count: 12 },
    { id: '35', name: '35', count: 18 },
    { id: '36', name: '36', count: 25 },
    { id: '37', name: '37', count: 32 },
    { id: '38', name: '38', count: 28 },
    { id: '39', name: '39', count: 20 },
    { id: '40', name: '40', count: 15 },
    { id: '41', name: '41', count: 8 },
    { id: '42', name: '42', count: 4 },
  ];

  // =================================================================
  // HANDLERS
  // =================================================================
  const handleCheckboxChange = (
    type: keyof Filters,
    id: string,
    checked: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [type]: checked
        ? [...(prev[type] as string[]), id]
        : (prev[type] as string[]).filter((item) => item !== id),
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number],
    }));
  };

  const handleRatingChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  // =================================================================
  // Contador de filtros ativos
  // =================================================================
  const activeFiltersCount = 
    filters.categories.length +
    filters.brands.length +
    filters.sizes.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0) +
    (filters.rating !== 'all' ? 1 : 0);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 hidden lg:block">
            Filtrar por
          </h2>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      {/* Acordeões de filtro */}
      <div className="divide-y divide-gray-100">
        
        {/* Categoria */}
        <FilterAccordion
          title="Categoria"
          icon={ChevronDown}
          iconColor="blue"
          defaultOpen
        >
          {categories.map((cat) => (
            <FilterCheckbox
              key={cat.id}
              id={`cat-${cat.id}`}
              label={cat.name}
              count={cat.count}
              checked={filters.categories.includes(cat.id)}
              onChange={(checked) =>
                handleCheckboxChange('categories', cat.id, checked)
              }
            />
          ))}
        </FilterAccordion>

        {/* Marca */}
        <FilterAccordion
          title="Marca"
          icon={ChevronDown}
          iconColor="purple"
          showSearch
          searchPlaceholder="Buscar marca"
        >
          {brands.map((brand) => (
            <FilterCheckbox
              key={brand.id}
              id={`brand-${brand.id}`}
              label={brand.name}
              count={brand.count}
              checked={filters.brands.includes(brand.id)}
              onChange={(checked) =>
                handleCheckboxChange('brands', brand.id, checked)
              }
            />
          ))}
        </FilterAccordion>

        {/* Tamanho */}
        <FilterAccordion
          title="Tamanho"
          icon={ChevronDown}
          iconColor="green"
        >
          <div className="grid grid-cols-4 gap-1">
            {sizes.map((size) => (
              <button
                key={size.id}
                onClick={() =>
                  handleCheckboxChange(
                    'sizes',
                    size.id,
                    !filters.sizes.includes(size.id)
                  )
                }
                className={cn(
                  'py-2 text-sm font-medium rounded border transition-colors',
                  filters.sizes.includes(size.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                )}
              >
                {size.name}
              </button>
            ))}
          </div>
        </FilterAccordion>

        {/* Faixa de Preço */}
        <FilterAccordion
          title="Faixa de preço"
          icon={ChevronDown}
          iconColor="orange"
        >
          <div className="space-y-4 px-1">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              min={0}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Mínimo</label>
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    handlePriceChange([Number(e.target.value), filters.priceRange[1]])
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <span className="text-gray-400 mt-6">—</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Máximo</label>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    handlePriceChange([filters.priceRange[0], Number(e.target.value)])
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </FilterAccordion>

        {/* Avaliação com estrelas */}
        <FilterAccordion
          title="Avaliação"
          icon={Star}
          iconColor="yellow"
        >
          <RadioGroup value={filters.rating} onValueChange={handleRatingChange} className="space-y-3 px-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                <Label
                  htmlFor={`rating-${rating}`}
                  className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4 transition-colors",
                          i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="ml-1">
                    {rating === 5 ? '5' : `${rating}+`}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </FilterAccordion>
      </div>

      {/* Botão limpar filtros */}
      {activeFiltersCount > 0 && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() =>
              setFilters({
                categories: [],
                brands: [],
                sizes: [],
                priceRange: [0, 1000],
                rating: 'all',
              })
            }
            className="w-full py-2 px-4 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <span>Limpar filtros</span>
            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};