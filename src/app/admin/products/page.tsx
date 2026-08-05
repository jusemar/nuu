"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableSwitch } from "@/components/admin/editable-switch";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SeloSituacaoPublicacao } from "@/features/products";
import { useProductBulkActions } from "@/hooks/admin/mutations/products/useProductBulkActions";
import { useProducts } from "@/hooks/admin/queries/products/use-products";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string | null;
  sku: string;
  isActive: boolean | null;
  status: string | null;
  storeProductFlags: string[] | null;
  brand: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { handleDeleteSelected } = useProductBulkActions();
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState("");
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [popoverCategoriaAberto, setPopoverCategoriaAberto] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);

  const categoriasDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();
    localProducts.forEach((produto) => {
      if (produto.categoryId && produto.categoryName) {
        mapa.set(produto.categoryId, produto.categoryName);
      }
    });
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [localProducts]);

  const categoriaSelecionada = categoriasDisponiveis.find(
    (categoria) => categoria.id === categoriaSelecionadaId,
  );

  const categoriasFiltradas = categoriasDisponiveis.filter((categoria) =>
    categoria.nome.toLowerCase().includes(buscaCategoria.toLowerCase()),
  );

  const filteredProducts = localProducts.filter((product) => {
    const correspondeCategoria =
      !categoriaSelecionadaId || product.categoryId === categoriaSelecionadaId;

    return correspondeCategoria;
  });

  useEffect(() => {
    if (products) {
      setLocalProducts(products);
      setOriginalProducts(products);
    }
  }, [products]);

  const updateLocalProduct = (
    id: string,
    field: keyof Product,
    value: Product[keyof Product],
  ) => {
    setLocalProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  };

  const hasChanges = useMemo(() => {
    if (localProducts.length !== originalProducts.length) return true;

    return localProducts.some((product, index) => {
      const original = originalProducts[index];
      if (!original) return true;

      return (
        product.name !== original.name ||
        product.slug !== original.slug ||
        product.description !== original.description
      );
    });
  }, [localProducts, originalProducts]);

  const saveChanges = () => {
    // Aqui você implementará a lógica de salvar no banco
    // Similar à função saveChanges das categorias
    toast.success("Alterações salvas com sucesso!", {
      style: {
        backgroundColor: "#22c55e",
        color: "#ffffff",
      },
    });
    setOriginalProducts(localProducts);
  };

  const cancelChanges = () => {
    setLocalProducts(originalProducts);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <span className="rounded bg-gray-50 px-2 py-1 font-mono text-sm text-gray-600">
          {String(row.getValue("sku"))}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <Link
          href={`/admin/products/${row.original.id}/edit`}
          className="font-medium text-gray-900 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          {String(row.getValue("name"))}
        </Link>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Categoria",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <span className="text-sm text-gray-600">
          {String(row.getValue("categoryName") || "Sem categoria")}
        </span>
      ),
    },
    /*status*/
    {
      accessorKey: "isActive",
      header: "Ativo",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <EditableSwitch
          value={Boolean(row.getValue("isActive"))}
          onSave={(newValue) =>
            updateLocalProduct(row.original.id, "isActive", newValue)
          }
        />
      ),
    },
    {
      // Situação real na loja: o switch "Ativo" sozinho não diz se o produto
      // aparece, porque as consultas públicas também exigem status publicado
      // e a flag de Catálogo.
      id: "situacaoPublicacao",
      header: "Publicação",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <SeloSituacaoPublicacao
          status={row.original.status}
          isActive={row.original.isActive}
          storeProductFlags={row.original.storeProductFlags}
        />
      ),
    },

    {
      accessorKey: "brand",
      header: "Marca",
      cell: ({ row }: CellContext<Product, unknown>) => (
        <span className="text-sm text-gray-600">
          {String(row.getValue("brand") || "—")}
        </span>
      ),
    },

    {
      accessorKey: "updatedAt",
      header: "Última atualização",
      cell: ({ row }: CellContext<Product, unknown>) => {
        const date = new Date(String(row.getValue("updatedAt")));
        return (
          <span className="text-sm text-gray-600">
            {date.toLocaleDateString("pt-BR")} às {date.getHours()}:
            {date.getMinutes().toString().padStart(2, "0")}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }: CellContext<Product, unknown>) => {
        const date = new Date(String(row.getValue("createdAt")));
        return (
          <span className="text-sm text-gray-600">
            {date.toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6 sm:p-6">
      {/* TOPO - 3 CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Produtos
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {products?.length || 0}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com Categoria</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {products?.filter((p) => p.categoryName).length || 0}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sem Categoria</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {products?.filter((p) => !p.categoryName).length || 0}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Plus className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="min-w-0 p-3 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de Produtos
              </h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} produto(s)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {hasChanges && (
                <>
                  <Button onClick={saveChanges} variant="default">
                    💾 Salvar
                  </Button>
                  <Button onClick={cancelChanges} variant="outline">
                    ↩️ Cancelar
                  </Button>
                </>
              )}
              <Button asChild className="w-full sm:w-auto">
                <Link href="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Link>
              </Button>
            </div>
          </div>

          <div className="min-w-0 [&_[data-slot=table]]:min-w-[38rem]">
            <DataTable
              columns={columns}
              data={filteredProducts}
              colunasPesquisaveis={["name", "sku"]}
              onDeleteSelected={handleDeleteSelected}
              filtroExtra={
                <Popover
                  open={popoverCategoriaAberto}
                  onOpenChange={setPopoverCategoriaAberto}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-10 w-full justify-between sm:w-[280px]"
                    >
                      <span className="truncate">
                        {categoriaSelecionada?.nome || "Selecionar categoria"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[calc(100vw-2rem)] p-2 sm:w-[320px]"
                    align="start"
                  >
                    <Input
                      value={buscaCategoria}
                      onChange={(e) => setBuscaCategoria(e.target.value)}
                      placeholder="Buscar categoria..."
                      className="mb-2 h-9"
                    />
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoriaSelecionadaId("");
                          setPopoverCategoriaAberto(false);
                          setBuscaCategoria("");
                        }}
                        className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
                      >
                        Todas as categorias
                      </button>
                      {categoriasFiltradas.map((categoria) => (
                        <button
                          key={categoria.id}
                          type="button"
                          onClick={() => {
                            setCategoriaSelecionadaId(categoria.id);
                            setPopoverCategoriaAberto(false);
                            setBuscaCategoria("");
                          }}
                          className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
                        >
                          {categoria.nome}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              }
              actionsContent={(row) => (
                <Link href={`/admin/products/${row.id}/edit`}>✏️</Link>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
