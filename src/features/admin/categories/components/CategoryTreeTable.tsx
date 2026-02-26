import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useUpdateCategory } from "../hooks/useUpdateCategory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import Link from "next/link";
import { useDeleteCategory } from "../hooks/useDeleteCategory";
import { useRestoreCategory } from "../hooks/useRestoreCategory";
import { useQueryClient } from "@tanstack/react-query";
import { useCategoryList } from "../hooks/useCategoryList";

// Tipo usado na árvore de categorias
type TreeCategory = {
  id: string;
  name: string;
  parentId: string | null;
  level: 0 | 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string | null;
  status: "active" | "inactive";
  productCount?: number;
  children?: TreeCategory[];
};

// Função para filtrar categorias por texto (nome)
const filterCategoriesByText = (
  categories: TreeCategory[],
  searchTerm: string,
): TreeCategory[] => {
  if (!searchTerm) return categories;

  return categories
    .map((cat) => ({
      ...cat,
      children: cat.children
        ? filterCategoriesByText(cat.children, searchTerm)
        : undefined,
    }))
    .filter((cat) => {
      const matchesName = cat.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const hasMatchingChildren = cat.children && cat.children.length > 0;
      return matchesName || hasMatchingChildren;
    });
};

// Função para filtrar categorias por status
const filterCategoriesByStatus = (
  categories: TreeCategory[],
  filter: string,
): TreeCategory[] => {
  if (filter === "all") return categories;

  return categories
    .map((cat) => ({
      ...cat,
      children: cat.children
        ? filterCategoriesByStatus(cat.children, filter)
        : undefined,
    }))
    .filter((cat) => {
      if (filter === "active") return cat.status === "active";
      if (filter === "inactive") return cat.status === "inactive";
      return true;
    });
};

// Componente de badge de status
const StatusBadge = ({ status }: { status: "active" | "inactive" }) => {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        status === "active"
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-red-200 bg-red-100 text-red-700",
      )}
    >
      {status === "active" ? "Ativa" : "Inativa"}
    </span>
  );
};

// Componente recursivo para renderizar cada linha
const TreeRow = ({
  category,
  level = 0,
  expandedItems,
  toggleExpand,
  onDeleteClick,
  onRestoreClick,
  onStatusChange,
  searchTerm,
}: {
  category: TreeCategory;
  level?: number;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
  onDeleteClick: (category: TreeCategory) => void;
  onRestoreClick: (categoryId: string) => void;
  onStatusChange: (id: string, status: boolean) => void
  searchTerm: string;
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedItems.has(category.id);

  // Destacar texto quando corresponder à busca
  const highlightText = (text: string) => {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="rounded bg-yellow-200 px-0.5">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  // Função para determinar indentação
  const getIndentWidth = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return level * 16;
    }
    return level * 24;
  };

  // Verifica se pode excluir (não pode se tiver filhos E deve ser nível 0)
  const canDelete = !hasChildren && level === 0;

  return (
    <>
      {/* Linha da categoria */}
      <TableRow
        className={cn(
          "transition-colors",
          category.status === "inactive" ? "bg-red-50/30" : "hover:bg-slate-50",
          isExpanded && category.status === "active" && "bg-blue-50/50",
        )}
      >
        <TableCell className="py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {/* Indentação */}
            <div style={{ width: `${getIndentWidth()}px` }} />

            {/* Botão de expandir ou bullet */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 flex-shrink-0 p-0 transition-colors",
                  isExpanded
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-blue-600",
                )}
                onClick={() => toggleExpand(category.id)}
                disabled={category.status === "inactive"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            ) : (
              <span className="w-5 flex-shrink-0 text-center text-xs text-slate-400">
                •
              </span>
            )}

            {/* Ícone baseado no nível */}
            <div
              className={cn(
                "flex-shrink-0 rounded p-0.5",
                level === 0 && "bg-slate-100",
                category.status === "inactive" && "opacity-50",
              )}
            >
              {level === 0 ? (
                <Folder
                  className={cn(
                    "h-3.5 w-3.5",
                    category.status === "inactive"
                      ? "text-red-400"
                      : "text-slate-600",
                  )}
                />
              ) : level === 1 ? (
                <Package
                  className={cn(
                    "h-3.5 w-3.5",
                    category.status === "inactive"
                      ? "text-red-400"
                      : "text-slate-500",
                  )}
                />
              ) : (
                <Tag
                  className={cn(
                    "h-3.5 w-3.5",
                    category.status === "inactive"
                      ? "text-red-400"
                      : "text-slate-400",
                  )}
                />
              )}
            </div>

            {/* Nome da categoria */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    level === 0 && "text-slate-800",
                    level === 1 && "text-slate-700",
                    level === 2 && "text-slate-600",
                    level === 3 && "text-xs text-slate-500",
                    category.status === "inactive" &&
                      "text-slate-500 line-through",
                  )}
                  title={category.name}
                >
                  {highlightText(category.name)}
                </span>

                {/* Badge de nível */}
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                  Nível {category.level}
                </span>

                {/* Badge de "Possui subcategorias" */}
                {hasChildren && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                    Possui sub
                  </span>
                )}

                {/* Badge de produtos */}
                {category.productCount && category.productCount > 0 && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                    {category.productCount} itens
                  </span>
                )}
              </div>

              {/* Data de exclusão */}
              {category.deleted_at && (
                <p className="mt-0.5 text-[10px] text-red-600">
                  Excluído:{" "}
                  {new Date(category.deleted_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Coluna de data criação */}
        <TableCell className="hidden py-2.5 sm:table-cell">
          <span className="text-xs text-slate-500">
            {new Date(category.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </TableCell>

        {/* Coluna de última alteração */}
        <TableCell className="hidden py-2.5 md:table-cell">
          <div className="text-xs text-slate-500">
            <div>
              {new Date(category.updatedAt).toLocaleDateString("pt-BR")}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(category.updatedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </TableCell>

        {/* Coluna de status com Switch */}
        <TableCell className="hidden py-2.5 md:table-cell">
          <div className="flex justify-center">
            <Switch
              checked={category.status === "active"}
              onCheckedChange={(checked) => onStatusChange(category.id, checked)}              
              className={cn(
                category.status === "active"
                  ? "data-[state=checked]:bg-green-600"
                  : "data-[state=unchecked]:bg-red-600",
              )}
            />
          </div>
        </TableCell>
        {/* Coluna de ações */}
        <TableCell className="py-2.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            {category.status === "active" ? (
              <>
                {/* Botão Editar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => console.log("Editar:", category.id)}
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

                {/* Botão Excluir - Só aparece se não tiver subcategorias */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDeleteClick(category)}
                    title="Excluir categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Inativa
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-7 items-center gap-1 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => onRestoreClick(category.id)}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden text-xs font-medium sm:inline">
                    Restaurar
                  </span>
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Renderiza filhos */}
      {hasChildren && isExpanded && category.status === "active" && (
        <>
          {category.children!.map((child) => (
            <TreeRow
              key={child.id}
              category={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              onDeleteClick={onDeleteClick}
              onRestoreClick={onRestoreClick}
              onStatusChange={onStatusChange}
              searchTerm={searchTerm}
            />
          ))}
        </>
      )}
    </>
  );
};

// Componente principal
export function CategoryTreeTable() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  // Hook para atualizar categoria
  const { mutate: updateCategory } = useUpdateCategory();

  // Estados para o modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState<"ok" | "blocked">(
    "ok",
  );
  const [categoryToDelete, setCategoryToDelete] = useState<TreeCategory | null>(
    null,
  );

  // ✅ HOOK NOVO - substitui o fetch manual
  const {
    data: categoriesData,
    isLoading: isLoadingData,
    error: loadError,
  } = useCategoryList();

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Hook para deletar categoria
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutate: restoreCategory } = useRestoreCategory();
  const queryClient = useQueryClient();

  // Função para alternar status ativo/inativo
  const handleStatusChange = (categoryId: string, newStatus: boolean) => {   
    updateCategory({
      id: categoryId,
      data: {
        isActive: newStatus,
      },
    });
  };

  // ✅ Função para converter dados do hook para TreeCategory
  const convertToTreeCategory = (data: any[]): TreeCategory[] => {
    const map = new Map<string, TreeCategory>();

    data.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        parentId: item.parentId ?? null,
        level: (item.level ?? 0) as 0 | 1 | 2 | 3,
        createdAt: item.createdAt ?? "",
        updatedAt: item.updatedAt ?? item.createdAt ?? "",
        deleted_at: null,
        status: item.isActive ? "active" : "inactive",
        productCount: undefined,
        children: [],
      });
    });

    const roots: TreeCategory[] = [];

    map.forEach((node) => {
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // ✅ Dados convertidos
  const categories = categoriesData
    ? convertToTreeCategory(categoriesData)
    : [];

  const toggleExpand = (id: string) => {
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

  // Função para abrir modal de exclusão
  const handleDeleteClick = (category: TreeCategory) => {
    const hasChildren = category.children && category.children.length > 0;

    setCategoryToDelete(category);

    if (hasChildren) {
      setDeleteModalType("blocked");
    } else {
      setDeleteModalType("ok");
    }

    setDeleteModalOpen(true);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = (type: "soft" | "hard") => {
    if (!categoryToDelete) return;

    deleteCategory(
      { id: categoryToDelete.id, type },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (error: any) => {
          console.error("[CategoryTreeTable] Erro ao deletar:", error);
        },
      },
    );
  };

  // Função para restaurar uma categoria inativa
  const handleRestoreClick = (categoryId: string) => {
    restoreCategory(categoryId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      },
      onError: (error: any) => {
        console.error("[CategoryTreeTable] Erro ao restaurar:", error);
      },
    });
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm || statusFilter !== "all";

  const sourceCategories = categories;

  // Aplicar filtros
  const filteredByStatus = filterCategoriesByStatus(
    sourceCategories,
    statusFilter,
  );
  const filteredCategories = filterCategoriesByText(
    filteredByStatus,
    searchTerm,
  );

  // Contar totais
  const totalCategories = sourceCategories.length;
  const activeCount = sourceCategories.filter(
    (c) => c.status === "active",
  ).length;
  const inactiveCount = sourceCategories.filter(
    (c) => c.status === "inactive",
  ).length;

  // Lógica de paginação
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset para página 1 quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  // Estados de loading e erro
  if (isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-slate-500">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-red-600">
          <p className="text-sm font-medium">Erro ao carregar categorias</p>
          <p className="text-xs text-red-500">{loadError.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      {/* Header com título e botão Nova Categoria */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
          <p className="text-sm text-slate-500">
            Gerencie as categorias e subcategorias da sua loja
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="h-9 bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </Link>
      </div>

      {/* Barra de busca e filtros */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {/* Linha principal de busca */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Busca por Nome */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full pr-8 pl-8 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm("")}
                  className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Filtros em linha */}
          <div className="flex items-center gap-2">
            {/* Select de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão Filtros Avançados */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className={cn("h-9 px-3", showFilters && "bg-slate-100")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && !showFilters && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              )}
            </Button>

            {/* Botão Limpar Filtros (só aparece quando tem filtros) */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros Avançados (expandível) */}
        {showFilters && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500">Filtros adicionais:</div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                  Nível
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                  Com produtos
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                  Sem subcategorias
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">
                {filteredCategories.length}
              </strong>{" "}
              resultados
              {statusFilter === "active" && (
                <span className="ml-1 text-green-600">(ativas)</span>
              )}
              {statusFilter === "inactive" && (
                <span className="ml-1 text-red-600">(inativas)</span>
              )}
            </p>
            {hasActiveFilters && (
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600">Filtros ativos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="min-w-[300px] py-3 text-xs font-semibold text-slate-700 sm:min-w-[350px]">
                  Categoria
                </TableHead>
                <TableHead className="hidden py-3 text-xs font-semibold text-slate-700 sm:table-cell">
                  Criado em
                </TableHead>
                <TableHead className="hidden py-3 text-xs font-semibold text-slate-700 md:table-cell">
                  Última alteração
                </TableHead>
                <TableHead className="hidden py-3 text-xs font-semibold text-slate-700 md:table-cell">
                  Status
                </TableHead>

                <TableHead className="py-3 text-right text-xs font-semibold text-slate-700">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderTree className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-slate-500">
                        Nenhuma categoria encontrada
                      </p>
                      <p className="text-xs text-slate-400">
                        Tente ajustar os filtros ou
                      </p>
                      <Link href="/admin/categories/new">
                        <Button
                          size="sm"
                          className="mt-1 h-8 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Nova categoria
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category) => (
                  <TreeRow
                    key={category.id}
                    category={category}
                    level={0}
                    expandedItems={expandedItems}
                    toggleExpand={toggleExpand}
                    onDeleteClick={handleDeleteClick}
                    onRestoreClick={handleRestoreClick}
                     onStatusChange={handleStatusChange}
                    searchTerm={searchTerm}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer com Paginação */}
        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Info de itens por página */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Itens por página:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info de paginação */}
            <div className="text-sm text-slate-600">
              Mostrando <strong>{startIndex + 1}</strong> a{" "}
              <strong>{Math.min(endIndex, filteredCategories.length)}</strong>{" "}
              de <strong>{filteredCategories.length}</strong> resultado(s)
            </div>

            {/* Botões de navegação */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9"
              >
                ← Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="h-9"
              >
                Próxima →
              </Button>
            </div>
          </div>
        </div>

        {/* Legenda compacta */}
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

      {/* Modal de exclusão */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        category={
          categoryToDelete
            ? {
                id: categoryToDelete.id,
                name: categoryToDelete.name,
                level: categoryToDelete.level,
                hasChildren: !!(
                  categoryToDelete.children &&
                  categoryToDelete.children.length > 0
                ),
                hasProducts: !!(
                  categoryToDelete.productCount &&
                  categoryToDelete.productCount > 0
                ),
                productsCount: categoryToDelete.productCount,
                childrenCount: categoryToDelete.children?.length,
                subcategories: categoryToDelete.children?.map((c) => c.name),
              }
            : null
        }
        type={deleteModalType}
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
          💡 Como funciona o Soft Delete
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <strong>Excluir:</strong> Itens ficam inativos mas podem ser
            restaurados
          </li>
          <li>
            • <strong>Filtros:</strong> Escolha visualizar ativas, inativas ou
            todas
          </li>
          <li>
            • <strong>Restaurar:</strong> Categorias excluídas podem voltar a
            ficar ativas
          </li>
          <li>
            • <strong>Categorias:</strong> Não podem ser excluídas se tiverem
            subcategorias
          </li>
        </ul>
      </div>
    </div>
  );
}

export default CategoryTreeTable;
