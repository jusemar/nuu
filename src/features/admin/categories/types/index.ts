/**
 * Tipos compartilhados para o domínio de Categorias
 * 
 * Princípios:
 * - Tipos separados por responsabilidade
 * - Evitar importações circulares
 * - Tipos para API (requests/responses)
 * - Tipos para UI (estados, props)
 * - Tipos para banco (derivados do Drizzle)
 */

// ========== TIPOS DO BANCO DE DADOS ==========

/**
 * Tipo derivado da tabela 'categories' do Drizzle
 */
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  metaTitle: string | null
  metaDescription: string | null
  orderIndex: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Tipo derivado da tabela 'subcategories' do Drizzle
 */
export interface Subcategory {
  id: string
  name: string
  slug: string
  description: string | null
  level: number
  parentId: string | null
  categoryId: string
  orderIndex: number
  isActive: boolean
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Categoria com subcategorias aninhadas (para hierarquia)
 */
export interface CategoryWithSubcategories extends Category {
  subcategories: SubcategoryWithChildren[]
}

/**
 * Subcategoria com filhos aninhados (para árvore)
 */
export interface SubcategoryWithChildren extends Subcategory {
  children: SubcategoryWithChildren[]
}

// ========== TIPOS PARA API REQUESTS ==========

/**
 * Request para criar uma nova categoria
 */
export interface CreateCategoryRequest {
  name: string
  slug?: string // Opcional: se não enviado, será gerado do nome
  description?: string
  isActive?: boolean
  metaTitle?: string
  metaDescription?: string
  orderIndex?: number
}

/**
 * Request para atualizar uma categoria
 */
export interface UpdateCategoryRequest {
  name?: string
  slug?: string
  description?: string | null
  isActive?: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  orderIndex?: number
}

/**
 * Request para criar uma subcategoria
 */
export interface CreateSubcategoryRequest {
  name: string
  slug?: string
  description?: string
  level: number
  parentId?: string | null
  categoryId: string
  orderIndex?: number
  isActive?: boolean
}

/**
 * Request para atualizar uma subcategoria
 */
export interface UpdateSubcategoryRequest {
  name?: string
  slug?: string
  description?: string | null
  level?: number
  parentId?: string | null
  orderIndex?: number
  isActive?: boolean
}

/**
 * Request para reordenar subcategorias (após drag-and-drop)
 */
export interface ReorderSubcategoriesRequest {
  categoryId: string
  updates: Array<{
    id: string
    level: number
    parentId: string | null
    orderIndex: number
  }>
}

/**
 * Request para exclusão em lote
 */
export interface BatchDeleteRequest {
  ids: string[]
}

// ========== TIPOS PARA API RESPONSES ==========

/**
 * Response padrão para operações bem-sucedidas
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/**
 * Response para erros da API
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

/**
 * Response para listagem paginada
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ========== TIPOS PARA UI/ESTADOS ==========

/**
 * Estado do formulário de categoria (usado no frontend)
 */
export interface CategoryFormState {
  id?: string
  name: string
  slug: string
  description: string
  isActive: boolean
  metaTitle: string
  metaDescription: string
  orderIndex: number
}

/**
 * Estado do formulário de subcategoria (usado no frontend)
 */
export interface SubcategoryFormState {
  id?: string
  name: string
  slug: string
  description: string
  level: number
  parentId?: string | null
  categoryId: string
  orderIndex: number
  isActive: boolean
}

/**
 * Item da árvore de subcategorias (usado no componente visual)
 */
export interface SubcategoryTreeItem {
  id: string
  name: string
  level: number
  parentId?: string | null
  childrenCount?: number
  expanded?: boolean
  children?: SubcategoryTreeItem[]
}

/**
 * Filtros para listagem de categorias
 */
export interface CategoryFilters {
  search?: string
  isActive?: boolean
  minLevel?: number
  maxLevel?: number
  sortBy?: 'name' | 'createdAt' | 'orderIndex'
  sortOrder?: 'asc' | 'desc'
}

// ========== TIPOS PARA HOOKS ==========

/**
 * Opções para queries do TanStack Query
 */
export interface QueryOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
}

/**
 * Opções para mutations do TanStack Query
 */
export interface MutationOptions<TVariables = any> {
  onSuccess?: (data: any, variables: TVariables, context: any) => void
  onError?: (error: Error, variables: TVariables, context: any) => void
  onSettled?: (data: any, error: Error | null, variables: TVariables, context: any) => void
  retry?: boolean | number
  retryDelay?: number
}

// ========== TIPOS PARA VALIDAÇÃO ==========

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean
  errors?: Record<string, string>
}

/**
 * Regras de validação para categoria
 */
export interface CategoryValidationRules {
  name: {
    required: boolean
    minLength: number
    maxLength: number
  }
  slug: {
    required: boolean
    pattern: RegExp
  }
  metaTitle: {
    maxLength: number
  }
  metaDescription: {
    maxLength: number
  }
}

// ========== TIPOS PARA ESTATÍSTICAS ==========

/**
 * Estatísticas de uma categoria
 */
export interface CategoryStats {
  totalSubcategories: number
  directSubcategories: number
  maxDepth: number
  productCount: number
  lastUpdated: Date
}

/**
 * Dashboard de categorias
 */
export interface CategoriesDashboard {
  totalCategories: number
  activeCategories: number
  totalSubcategories: number
  averageDepth: number
  recentActivity: Array<{
    id: string
    name: string
    action: 'created' | 'updated' | 'deleted'
    timestamp: Date
  }>
}

// ========== ENUMS ==========

/**
 * Status de uma categoria/subcategoria
 */
export enum EntityStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Níveis de permissão para categorias
 */
export enum CategoryPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE_SUBCATEGORIES = 'manage_subcategories'
}

/**
 * Eventos de auditoria para categorias
 */
export enum AuditEvent {
  CATEGORY_CREATED = 'category_created',
  CATEGORY_UPDATED = 'category_updated',
  CATEGORY_DELETED = 'category_deleted',
  SUBCATEGORY_CREATED = 'subcategory_created',
  SUBCATEGORY_UPDATED = 'subcategory_updated',
  SUBCATEGORY_DELETED = 'subcategory_deleted',
  HIERARCHY_CHANGED = 'hierarchy_changed'
}

// ========== UTILITY TYPES ==========

/**
 * Tipo para partial deep (todos os campos opcionais, incluindo aninhados)
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

/**
 * Tipo para omitir campos de um tipo
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Tipo para selecionar apenas alguns campos de um tipo
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// ========== EXPORT AGGREGATE ==========

/**
 * Exportação agregada de todos os tipos
 */
export type {
  Category,
  Subcategory,
  CategoryWithSubcategories,
  SubcategoryWithChildren,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateSubcategoryRequest,
  UpdateSubcategoryRequest,
  ReorderSubcategoriesRequest,
  ApiSuccessResponse,
  ApiErrorResponse,
  CategoryFormState,
  SubcategoryFormState,
  SubcategoryTreeItem,
  CategoryFilters,
  ValidationResult,
  CategoryStats
}

export {
  EntityStatus,
  CategoryPermission,
  AuditEvent
}