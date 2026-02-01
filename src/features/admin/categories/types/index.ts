/**
 * Tipos para Categorias e Subcategorias
 * 
 * Este arquivo define os tipos usados em toda a feature de categories.
 * Inclui tipos para entidades do banco, requests e responses.
 * Usamos TypeScript para garantir segurança de tipos.
 */

// Tipo base para uma subcategoria (sem children por enquanto)
export interface SubcategoryBase {
  name: string;
  slug: string;           // OBRIGATÓRIO: usado em URLs, SEO e navegação
  level: number;          // 1 para sub, 2 para sub-sub, etc.
  parentId?: string;      // ID do pai (opcional apenas para subs diretas da categoria raiz)
  orderIndex: number;
  description?: string;   // Opcional, pode ser vazio
}

// Tipo recursivo para subcategorias com hierarquia (children)
// Permite representar árvores: sub pode ter subs, etc.
export type HierarchicalSubcategory = SubcategoryBase & {
  children?: HierarchicalSubcategory[]; // Array recursivo para filhos
};

// Tipo para categoria como vem do banco (Drizzle)
export interface Category {
  id: string;
  name: string;
  slug: string;           // OBRIGATÓRIO
  description?: string | null;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  orderIndex: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Contagem de subs (para listas)
  subcategoriesCount?: number;
  // Subs hierárquicas (quando buscamos detalhes completos)
  subcategories?: HierarchicalSubcategory[];
}

// Input para CRIAR categoria (inclui subs opcionais)
export interface CreateCategoryInput {
  name: string;
  slug: string;           // OBRIGATÓRIO: deve vir preenchido do formulário
  description?: string;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  orderIndex: number;
  // userId pode ser opcional no input — o servidor pode preencher a partir do contexto de autenticação
  userId?: string;
  // Novo: subs hierárquicas (opcional – pode criar categoria sem subs)
  subcategories?: HierarchicalSubcategory[];
}

// Input para ATUALIZAR categoria (slug pode ser alterado, mas ainda obrigatório se enviado)
export interface UpdateCategoryInput {
  name?: string;
  slug?: string;          // Se enviado, deve ser string válida (não vazio)
  description?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  orderIndex?: number;
}

// Input para criar subcategoria isolada (mantido para usos futuros)
export interface CreateSubcategoryInput {
  name: string;
  slug: string;           // OBRIGATÓRIO
  level: number;
  parentId?: string;
  categoryId: string;     // Liga à categoria principal
  orderIndex: number;
  description?: string;
}

// Tipos auxiliares (já existiam ou úteis para filtros/paginação)
export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: keyof Category;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}