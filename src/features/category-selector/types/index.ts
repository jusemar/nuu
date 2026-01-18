export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;        // URL da imagem da categoria (opcional)
  icon?: string;           // Ícone (opcional)
  color?: string;         // Cor personalizada (opcional)
  productCount?: number;  // Quantidade de produtos (opcional)
}

export interface CategorySelectorProps {
  categories: Category[];
  activeCategory?: string;  // slug da categoria ativa (opcional)
  isLoading?: boolean;      // estado de carregamento (opcional)
  onCategorySelect?: (slug: string) => void; // callback opcional
}