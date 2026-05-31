'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  colors: string[];
  priceRange: [number, number];
  rating: string;
}

interface ItemFiltro {
  id: string;
  name: string;
  count: number;
}

interface DadosFiltroCategoria {
  categories: ItemFiltro[];
  brands: ItemFiltro[];
  sizes: ItemFiltro[];
  colors: ItemFiltro[];
  priceRange: [number, number];
}

const CHAVES_FILTRO = [
  'categories',
  'brands',
  'sizes',
  'colors',
  'minPrice',
  'maxPrice',
  'rating',
] as const;

type ModoFiltro = 'desktop' | 'mobile';

function formatarCentavosParaBr(valorEmCentavos: number) {
  return (valorEmCentavos / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseBrParaCentavos(valor: string) {
  const normalizado = valor.replace(/\./g, '').replace(',', '.').trim();
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return 0;
  return Math.round(numero * 100);
}

function parseLista(valor: string | null) {
  if (!valor) return [];
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFiltrosDaUrl(
  params: URLSearchParams,
  faixaMinima: number,
  faixaMaxima: number,
): Filters {
  const parseNumero = (valor: string | null) => {
    if (valor === null) return null;
    const limpo = valor.trim();
    if (!limpo) return null;
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : null;
  };

  const minUrl = parseNumero(params.get('minPrice'));
  const maxUrl = parseNumero(params.get('maxPrice'));
  const minPrice = minUrl ?? faixaMinima;
  const maxPrice = maxUrl ?? faixaMaxima;

  return {
    categories: parseLista(params.get('categories')),
    brands: parseLista(params.get('brands')),
    sizes: parseLista(params.get('sizes')),
    colors: parseLista(params.get('colors')),
    priceRange: [Math.min(minPrice, maxPrice), Math.max(minPrice, maxPrice)],
    rating: params.get('rating') || 'all',
  };
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
export const CategoryFilter = ({
  dados,
  modo = 'desktop',
}: {
  dados: DadosFiltroCategoria;
  modo?: ModoFiltro;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const faixaMinima = dados.priceRange[0];
  const faixaMaxima =
    dados.priceRange[1] > dados.priceRange[0]
      ? dados.priceRange[1]
      : dados.priceRange[0] + 1;

  const filtrosUrl = useMemo(
    () => parseFiltrosDaUrl(new URLSearchParams(searchParams.toString()), faixaMinima, faixaMaxima),
    [searchParams, faixaMinima, faixaMaxima],
  );
  const [filters, setFilters] = useState<Filters>(filtrosUrl);

  useEffect(() => {
    setFilters(filtrosUrl);
  }, [filtrosUrl]);

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

  const aplicarFiltros = (filtros: Filters) => {
    const params = new URLSearchParams(searchParams.toString());

    CHAVES_FILTRO.forEach((chave) => params.delete(chave));

    if (filtros.categories.length > 0) params.set('categories', filtros.categories.join(','));
    if (filtros.brands.length > 0) params.set('brands', filtros.brands.join(','));
    if (filtros.sizes.length > 0) params.set('sizes', filtros.sizes.join(','));
    if (filtros.colors.length > 0) params.set('colors', filtros.colors.join(','));
    if (filtros.priceRange[0] > faixaMinima) params.set('minPrice', String(filtros.priceRange[0]));
    if (filtros.priceRange[1] < faixaMaxima) params.set('maxPrice', String(filtros.priceRange[1]));
    if (filtros.rating !== 'all') params.set('rating', filtros.rating);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // =================================================================
  // Contador de filtros ativos
  // =================================================================
  const activeFiltersCount = 
    filters.categories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.priceRange[0] > faixaMinima ||
    filters.priceRange[1] < faixaMaxima
      ? 1
      : 0) +
    (filters.rating !== 'all' ? 1 : 0);

  useEffect(() => {
    if (modo === 'desktop') {
      aplicarFiltros(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, filters]);

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
        {dados.categories.length > 0 && (
          <FilterAccordion
            title="Categoria"
            icon={ChevronDown}
            iconColor="blue"
            defaultOpen
          >
            {dados.categories.map((cat) => (
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
        )}

        {/* Marca */}
        {dados.brands.length > 0 && (
          <FilterAccordion
            title="Marca"
            icon={ChevronDown}
            iconColor="purple"
            showSearch
            searchPlaceholder="Buscar marca"
          >
            {dados.brands.map((brand) => (
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
        )}

        {/* Tamanho */}
        {dados.sizes.length > 0 && (
          <FilterAccordion
            title="Tamanho"
            icon={ChevronDown}
            iconColor="green"
          >
            <div className="grid grid-cols-4 gap-1">
              {dados.sizes.map((size) => (
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
        )}

        {dados.colors.length > 0 && (
          <FilterAccordion
            title="Cores"
            icon={ChevronDown}
            iconColor="rose"
          >
            {dados.colors.map((color) => (
              <FilterCheckbox
                key={color.id}
                id={`color-${color.id}`}
                label={color.name}
                count={color.count}
                checked={filters.colors.includes(color.id)}
                onChange={(checked) =>
                  handleCheckboxChange('colors', color.id, checked)
                }
              />
            ))}
          </FilterAccordion>
        )}

        {/* Faixa de Preço */}
        <FilterAccordion
          title="Faixa de preço"
          icon={ChevronDown}
          iconColor="orange"
        >
          <div className="space-y-4 px-1 pt-1">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              min={faixaMinima}
              max={faixaMaxima}
              step={10}
              className="w-full"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Mínimo</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formatarCentavosParaBr(filters.priceRange[0])}
                  onChange={(e) =>
                    handlePriceChange([
                      parseBrParaCentavos(e.target.value),
                      filters.priceRange[1],
                    ])
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <span className="text-gray-400 mt-6">—</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Máximo</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formatarCentavosParaBr(filters.priceRange[1])}
                  onChange={(e) =>
                    handlePriceChange([
                      filters.priceRange[0],
                      parseBrParaCentavos(e.target.value),
                    ])
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
          {modo === 'mobile' && (
            <button
              onClick={() => aplicarFiltros(filters)}
              className="w-full py-2 px-4 mb-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Aplicar filtros</span>
            </button>
          )}
          <button
            onClick={() =>
              (() => {
                const limpos: Filters = {
                categories: [],
                brands: [],
                sizes: [],
                colors: [],
                priceRange: [faixaMinima, faixaMaxima],
                rating: 'all',
              };
                setFilters(limpos);
                aplicarFiltros(limpos);
              })()
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
