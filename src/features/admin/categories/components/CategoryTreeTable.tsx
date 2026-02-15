// Componente de tabela em árvore para exibir categorias com hierarquia
// Usa shadcn/ui Table como base e adiciona funcionalidades de expansão, busca e paginação

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Package, 
  Tag,
  Trash2,
  RotateCcw,
  FolderTree,
  Search,
  Plus,
  Filter,
  X,
  SlidersHorizontal,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox' // Para selecionar linhas
import { cn } from '@/lib/utils' // Utilitário para combinar classes condicionalmente
import { DeleteCategoryModal } from './DeleteCategoryModal' // Modal de exclusão
import Link from 'next/link'
import { useCategoryList } from '../hooks/useCategoryList' // Hook para buscar categorias
import { useDeleteCategory } from '../hooks/useDeleteCategory' // 🔥 Hook para excluir categorias
import type { Category } from '../services/categoryService' // Tipo Category

// ============================================
// FUNÇÕES AUXILIARES (FILTROS)
// ============================================

// Filtra categorias por texto (busca por nome) - percorre a árvore toda
const filterCategoriesByText = (
  categories: Category[], 
  searchTerm: string
): Category[] => {
  if (!searchTerm) return categories // Se não tem busca, retorna todas
  
  return categories
    .map(cat => ({
      ...cat,
      // Chama recursivamente para os filhos
      children: cat.children ? filterCategoriesByText(cat.children, searchTerm) : undefined
    }))
    .filter(cat => {
      // Verifica se o nome da categoria atual corresponde à busca
      const matchesName = cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      // Verifica se algum filho corresponde (para manter pais de resultados)
      const hasMatchingChildren = cat.children && cat.children.length > 0
      // Mantém a categoria se ela corresponde OU se tem filhos que correspondem
      return matchesName || hasMatchingChildren
    })
}

// Filtra categorias por status (ativo/inativo) - percorre a árvore toda
const filterCategoriesByStatus = (
  categories: Category[], 
  filter: string
): Category[] => {
  if (filter === 'all') return categories // Se filtro é 'all', retorna todas
  
  return categories
    .map(cat => ({
      ...cat,
      // Chama recursivamente para os filhos
      children: cat.children ? filterCategoriesByStatus(cat.children, filter) : undefined
    }))
    .filter(cat => {
      // Filtra baseado no status
      if (filter === 'active') return cat.status === 'active'
      if (filter === 'inactive') return cat.status === 'inactive'
      return true
    })
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// Componente de badge de status (ativo/inativo)
const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium border',
        status === 'active'
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200' // Verde para ativo
          : 'bg-red-100 text-red-700 border-red-200' // Vermelho para inativo
      )}
    >
      {status === 'active' ? 'Ativa' : 'Inativa'}
    </span>
  )
}

// ============================================
// COMPONENTE RECURSIVO DE LINHA (O CORAÇÃO DA TABELA)
// ============================================

// Componente que renderiza uma linha da categoria e suas subcategorias recursivamente
const TreeRow = ({
  category,               // Dados da categoria atual
  level = 0,               // Nível na hierarquia (0 = raiz, 1 = filho, etc)
  expandedItems,           // Set com IDs das categorias expandidas
  toggleExpand,            // Função para expandir/recolher
  onDeleteClick,           // Função chamada ao clicar no botão excluir
  searchTerm,              // Termo de busca para highlight
  isSelected,              // Se a linha está selecionada (checkbox)
  onSelectChange           // Função para alterar seleção
}: {
  category: Category
  level?: number
  expandedItems: Set<string>
  toggleExpand: (id: string) => void
  onDeleteClick: (category: Category) => void
  searchTerm: string
  isSelected?: boolean
  onSelectChange?: (id: string, checked: boolean) => void
}) => {
  // Verifica se a categoria tem filhos (subcategorias)
  const hasChildren = category.children && category.children.length > 0
  // Verifica se está expandido (filhos visíveis)
  const isExpanded = expandedItems.has(category.id)
  
  // ============================================
  // FUNÇÃO PARA DESTACAR O TEXTO DA BUSCA
  // ============================================
  const highlightText = (text: string) => {
    if (!searchTerm) return text // Se não tem busca, retorna o texto normal
    
    // Divide o texto pelo termo de busca e destaca as partes que correspondem
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> // Destaca em amarelo
          ) : (
            part
          )
        )}
      </>
    )
  }

  // ============================================
  // INDENTAÇÃO RESPONSIVA
  // ============================================
  const getIndentWidth = () => {
    // Em mobile, indentação menor para economizar espaço
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return level * 16
    }
    return level * 24
  }

  // Verifica se pode excluir (não pode se tiver filhos)
  const canDelete = !hasChildren

  return (
    <>
      {/* Linha da categoria atual */}
      <TableRow
        className={cn(
          'transition-colors',
          category.status === 'inactive' ? 'bg-red-50/30' : 'hover:bg-slate-50', // Fundo vermelho se inativo
          isExpanded && category.status === 'active' && 'bg-blue-50/50' // Fundo azul se expandido
        )}
      >
        {/* Checkbox de seleção (só aparece para categorias nível 0 - pais) */}
        {level === 0 && (
          <TableCell className="py-2.5 w-10">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={(checked) => onSelectChange?.(category.id, checked === true)}
            />
          </TableCell>
        )}
        {level > 0 && <TableCell className="py-2.5 w-10" />} {/* Espaço vazio para alinhar */}

        {/* Coluna 1: Categoria (com ícone, nome e badges) */}
        <TableCell className="py-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Indentação baseada no nível */}
            <div style={{ width: `${getIndentWidth()}px` }} />
            
            {/* Botão de expandir ou bullet point */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-5 w-5 p-0 flex-shrink-0 transition-colors',
                  isExpanded ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
                )}
                onClick={() => toggleExpand(category.id)}
                disabled={category.status === 'inactive'} // Não expande se inativo
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" /> // Seta para baixo quando expandido
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" /> // Seta para direita quando fechado
                )}
              </Button>
            ) : (
              <span className="w-5 text-center text-slate-400 flex-shrink-0 text-xs">•</span> // Bullet para sem filhos
            )}

            {/* Ícone baseado no nível da categoria */}
            <div className={cn(
              'rounded p-0.5 flex-shrink-0',
              level === 0 && 'bg-slate-100', // Fundo cinza só para nível 0
              category.status === 'inactive' && 'opacity-50' // Mais transparente se inativo
            )}>
              {level === 0 ? (
                <Folder className={cn(
                  'h-3.5 w-3.5',
                  category.status === 'inactive' ? 'text-red-400' : 'text-slate-600'
                )} />
              ) : level === 1 ? (
                <Package className={cn(
                  'h-3.5 w-3.5',
                  category.status === 'inactive' ? 'text-red-400' : 'text-slate-500'
                )} />
              ) : (
                <Tag className={cn(
                  'h-3.5 w-3.5',
                  category.status === 'inactive' ? 'text-red-400' : 'text-slate-400'
                )} />
              )}
            </div>

            {/* Nome da categoria e badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Nome com destaque da busca */}
                <span
                  className={cn(
                    'font-medium truncate text-sm',
                    level === 0 && 'text-slate-800',
                    level === 1 && 'text-slate-700',
                    level === 2 && 'text-slate-600',
                    level === 3 && 'text-slate-500 text-xs',
                    category.status === 'inactive' && 'line-through text-slate-500' // Riscado se inativo
                  )}
                  title={category.name}
                >
                  {highlightText(category.name)}
                </span>

                {/* Badge de nível */}
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  Nível {category.level}
                </span>

                {/* Badge de quantidade de subcategorias */}
                {hasChildren && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    {category.children?.length || 0} subs
                  </span>
                )}
              </div>

              {/* Data de exclusão (soft delete) */}
              {category.deleted_at && (
                <p className="text-[10px] text-red-600 mt-0.5">
                  Excluído: {new Date(category.deleted_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Coluna 2: Criado em */}
        <TableCell className="hidden sm:table-cell py-2.5">
          <span className="text-xs text-slate-500">
            {new Date(category.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </TableCell>

        {/* Coluna 3: Última alteração */}
        <TableCell className="hidden sm:table-cell py-2.5">
          <span className="text-xs text-slate-500">
            {category.updatedAt 
              ? new Date(category.updatedAt).toLocaleDateString('pt-BR') + ' ' + 
                new Date(category.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '—' // Se não tem updatedAt, mostra traço
            }
          </span>
        </TableCell>

        {/* Coluna 4: Status */}
        <TableCell className="hidden md:table-cell py-2.5">
          <StatusBadge status={category.status} />
        </TableCell>

        {/* Coluna 5: Ações (editar, excluir, restaurar) */}
        <TableCell className="text-right py-2.5">
          <div className="flex items-center justify-end gap-0.5">
            {category.status === 'active' ? (
              <>
                {/* Botão Editar (lápis) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => console.log('Editar:', category.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>

                {/* Botão Excluir (lixeira) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 transition-colors',
                    canDelete 
                      ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                      : 'text-slate-300 cursor-not-allowed'
                  )}
                  onClick={() => canDelete && onDeleteClick(category)}
                  disabled={!canDelete}
                  title={!canDelete ? 'Remova as subcategorias primeiro' : 'Excluir categoria'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                {/* Badge de inativo */}
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium mr-1">
                  Inativa
                </span>
                {/* Botão Restaurar */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1 px-2"
                  onClick={() => console.log('Restaurar:', category.id)}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="text-xs font-medium hidden sm:inline">Restaurar</span>
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Renderiza os filhos recursivamente (se expandido) */}
      {hasChildren && isExpanded && category.status === 'active' && (
        <>
          {category.children!.map((child) => (
            <TreeRow
              key={child.id}
              category={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              onDeleteClick={onDeleteClick}
              searchTerm={searchTerm}
            />
          ))}
        </>
      )}
    </>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function CategoryTreeTable() {
  // Estados para controle da UI
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()) // Itens expandidos
  const [searchTerm, setSearchTerm] = useState('') // Termo de busca
  const [statusFilter, setStatusFilter] = useState<string>('all') // Filtro de status
  const [showFilters, setShowFilters] = useState(false) // Mostrar filtros avançados
  
  // Estados para paginação e seleção
  const [pageIndex, setPageIndex] = useState(0) // Página atual
  const [pageSize, setPageSize] = useState(10) // Itens por página
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({}) // Linhas selecionadas
  
  // 🔥 HOOKS DE DADOS
  const { data: categories, isLoading, error } = useCategoryList() // Buscar categorias
  const deleteCategory = useDeleteCategory() // Hook para excluir categorias
  
  // Estados para o modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteModalType, setDeleteModalType] = useState<'ok' | 'blocked'>('ok')
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO
  // ============================================

  // Alterna expansão de uma categoria
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id) // Se já está expandido, recolhe
      } else {
        next.add(id) // Se está recolhido, expande
      }
      return next
    })
  }

  // Abre modal de exclusão
  const handleDeleteClick = (category: Category) => {
    const hasChildren = category.children && category.children.length > 0
    setCategoryToDelete(category)
    setDeleteModalType(hasChildren ? 'blocked' : 'ok') // 'blocked' se tem filhos
    setDeleteModalOpen(true)
  }

  // 🔥 Confirma exclusão (chama a mutation)
  const handleConfirmDelete = (type: 'soft' | 'hard') => {
    if (categoryToDelete) {
      deleteCategory.mutate({
        id: categoryToDelete.id,
        type: type
      })
    }
    setDeleteModalOpen(false)
  }

  // Limpa todos os filtros
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  // Verifica se há filtros ativos
  const hasActiveFilters = searchTerm || statusFilter !== 'all'

  // Alterna seleção de uma linha
  const handleSelectRow = (id: string, checked: boolean) => {
    setRowSelection(prev => ({
      ...prev,
      [id]: checked
    }))
  }

  // ============================================
  // FUNÇÕES DE CONTAGEM (RECURSIVAS)
  // ============================================

  // Conta total de categorias (percorre árvore)
  const countCategories = (cats: Category[] = []): number => {
    return cats.reduce((total, cat) => {
      return total + 1 + countCategories(cat.children)
    }, 0)
  }

  // Conta categorias por status (percorre árvore)
  const countByStatus = (cats: Category[] = [], status: 'active' | 'inactive'): number => {
    return cats.reduce((total, cat) => {
      const match = cat.status === status ? 1 : 0
      return total + match + countByStatus(cat.children, status)
    }, 0)
  }

  // Totais para os badges dos filtros
  const totalCategories = countCategories(categories || [])
  const activeCount = countByStatus(categories || [], 'active')
  const inactiveCount = countByStatus(categories || [], 'inactive')

  // ============================================
  // APLICAÇÃO DOS FILTROS
  // ============================================

  // Primeiro filtra por status, depois por texto
  const filteredByStatus = filterCategoriesByStatus(categories || [], statusFilter)
  const filteredCategories = filterCategoriesByText(filteredByStatus, searchTerm)

  // ============================================
  // PAGINAÇÃO (APENAS PAIS - NÍVEL 0)
  // ============================================

  // Extrai apenas categorias pai (nível 0) para paginação
  const parentCategories = filteredCategories.filter(cat => cat.level === 0)
  
  // Fatia os pais para a página atual
  const paginatedParents = parentCategories.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  )
  
  // Calcula total de páginas
  const pageCount = Math.ceil(parentCategories.length / pageSize)

  // Conta linhas selecionadas
  const selectedCount = Object.keys(rowSelection).length

  // ============================================
  // ESTADOS DE CARREGAMENTO E ERRO
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Carregando categorias...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-red-600">
          <p className="text-sm font-medium">Erro ao carregar categorias</p>
          <p className="text-xs text-red-500">{error.message}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================
  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      {/* HEADER: Título e botão Nova Categoria */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
          <p className="text-sm text-slate-500">Gerencie as categorias e subcategorias da sua loja</p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
        </Link>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        {/* Linha principal com busca e selects */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input de busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 h-9 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Controles de filtro */}
          <div className="flex items-center gap-2">
            {/* Select de status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão para mostrar/ocultar filtros avançados */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className={cn(
                'h-9 px-3',
                showFilters && 'bg-slate-100'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && !showFilters && (
                <span className="ml-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              )}
            </Button>

            {/* Botão para limpar filtros (só aparece quando há filtros ativos) */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* FILTROS AVANÇADOS (expandíveis) */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500">Filtros adicionais:</div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">Nível</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">Com produtos</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">Sem subcategorias</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTADOR DE RESULTADOS */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">{filteredCategories.length}</strong> resultados
              {statusFilter === 'active' && (
                <span className="text-green-600 ml-1">(ativas)</span>
              )}
              {statusFilter === 'inactive' && (
                <span className="text-red-600 ml-1">(inativas)</span>
              )}
            </p>
            {hasActiveFilters && (
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Filtros ativos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABELA PRINCIPAL */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <Table>
            {/* Cabeçalho da tabela */}
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="w-10 py-3">
                  <Checkbox /> {/* Checkbox para selecionar todos */}
                </TableHead>
                <TableHead className="font-semibold text-slate-700 py-3 min-w-[300px] sm:min-w-[350px] text-xs">
                  Categoria
                </TableHead>
                <TableHead className="font-semibold text-slate-700 py-3 hidden sm:table-cell text-xs">
                  Criado em
                </TableHead>
                <TableHead className="font-semibold text-slate-700 py-3 hidden sm:table-cell text-xs">
                  Última alteração
                </TableHead>
                <TableHead className="font-semibold text-slate-700 py-3 hidden md:table-cell text-xs">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-slate-700 py-3 text-right text-xs">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            {/* Corpo da tabela */}
            <TableBody>
              {paginatedParents.length === 0 ? (
                // Mensagem quando não há resultados
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderTree className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">Nenhuma categoria encontrada</p>
                      <p className="text-xs text-slate-400">
                        Tente ajustar os filtros ou
                      </p>
                      <Link href="/admin/categories/new">
                        <Button size="sm" className="mt-1 bg-blue-600 hover:bg-blue-700 h-8">
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Nova categoria
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Renderiza as categorias paginadas
                paginatedParents.map((category) => (
                  <TreeRow
                    key={category.id}
                    category={category}
                    level={0}
                    expandedItems={expandedItems}
                    toggleExpand={toggleExpand}
                    onDeleteClick={handleDeleteClick}
                    searchTerm={searchTerm}
                    isSelected={rowSelection[category.id]}
                    onSelectChange={handleSelectRow}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER: Paginação e seleção */}
        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
          {/* Contador de linhas selecionadas */}
          <div className="text-sm text-slate-500">
            {selectedCount} de {parentCategories.length} linha(s) selecionada(s)
          </div>

          {/* Controles de paginação */}
          <div className="flex items-center gap-6">
            {/* Dropdown de itens por página */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Linhas por página</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPageIndex(0) // Volta para primeira página
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Indicador de página atual */}
            <span className="text-sm text-slate-500">
              Página {pageIndex + 1} de {pageCount || 1}
            </span>

            {/* Botões de navegação */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPageIndex(prev => Math.min(pageCount - 1, prev + 1))}
                disabled={pageIndex >= pageCount - 1}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        {/* LEGENDA: Explica os ícones para o usuário */}
        <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <ChevronRight className="h-2.5 w-2.5" />
              <span>Expandir</span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronDown className="h-2.5 w-2.5 text-blue-600" />
              <span>Expandido</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">•</span>
              <span>Sem sub</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="h-2.5 w-2.5" />
              <span>Busca</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        category={categoryToDelete ? {
          id: categoryToDelete.id,
          name: categoryToDelete.name,
          level: categoryToDelete.level,
          hasChildren: !!(categoryToDelete.children && categoryToDelete.children.length > 0),
          hasProducts: false,
          productsCount: 0,
          childrenCount: categoryToDelete.children?.length,
          subcategories: categoryToDelete.children?.map(c => c.name)
        } : null}
        type={deleteModalType}
      />

      {/* INFO BOX: Explica soft delete */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-medium text-blue-900 text-xs flex items-center gap-1 mb-1">
          💡 Soft Delete
        </h3>
        <p className="text-xs text-blue-800">
          Exclusão reversível: itens ficam inativos e podem ser restaurados. 
          Categorias com subcategorias não podem ser excluídas.
        </p>
      </div>
    </div>
  )
}

export default CategoryTreeTable