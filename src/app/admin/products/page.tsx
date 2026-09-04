"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableSwitch } from "@/components/admin/editable-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DiagnosticoLogisticoProduto } from "@/features/logistica/lib/diagnosticar-logistica-produto";
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
  weight: number | null;
  height: number | null;
  width: number | null;
  length: number | null;
  diagnosticoLogistico: DiagnosticoLogisticoProduto | null;
  createdAt: Date;
  updatedAt: Date;
}

function formatarMedida(valor: number | null, unidade: "g" | "cm") {
  if (valor === null || valor === undefined) return "Ausente";
  if (!Number.isFinite(valor) || valor <= 0) return `Inválido (${valor})`;
  return `${valor} ${unidade}`;
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const somenteProblemasLogisticos =
    searchParams.get("problemaLogistico") === "true";
  const { data: products, isLoading } = useProducts();
  const { handleDeleteSelected } = useProductBulkActions();
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState("");
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [popoverCategoriaAberto, setPopoverCategoriaAberto] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [origemSelecionada, setOrigemSelecionada] = useState("");
  const [problemaSelecionado, setProblemaSelecionado] = useState("");

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

  const origensDisponiveis = useMemo(() => {
    const origens = new Map<string, string>();
    localProducts.forEach((produto) => {
      const origem = produto.diagnosticoLogistico?.origem;
      if (origem) origens.set(origem.chave, origem.rotulo);
    });
    return [...origens.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "pt-BR"),
    );
  }, [localProducts]);

  const problemasDisponiveis = useMemo(() => {
    const problemas = new Map<string, string>();
    localProducts.forEach((produto) => {
      produto.diagnosticoLogistico?.problemas.forEach((problema) =>
        problemas.set(problema.codigo, problema.mensagemAdmin),
      );
    });
    return [...problemas.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "pt-BR"),
    );
  }, [localProducts]);

  const filteredProducts = localProducts.filter((product) => {
    const correspondeCategoria =
      !categoriaSelecionadaId || product.categoryId === categoriaSelecionadaId;
    const correspondeLogistica =
      !somenteProblemasLogisticos ||
      product.diagnosticoLogistico?.valido === false;
    const correspondeOrigem =
      !origemSelecionada ||
      product.diagnosticoLogistico?.origem.chave === origemSelecionada;
    const correspondeProblema =
      !problemaSelecionado ||
      product.diagnosticoLogistico?.problemas.some(
        (problema) => problema.codigo === problemaSelecionado,
      );

    return (
      correspondeCategoria &&
      correspondeLogistica &&
      correspondeOrigem &&
      correspondeProblema
    );
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
    ...(somenteProblemasLogisticos
      ? ([
          {
            id: "origemLogistica",
            header: "Origem / fornecedor",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <div className="max-w-52 text-sm">
                <p className="font-medium">
                  {row.original.diagnosticoLogistico?.origem.rotulo ?? "—"}
                </p>
                {row.original.diagnosticoLogistico?.origem.provedor ? (
                  <p className="text-muted-foreground text-xs">
                    Provedor:{" "}
                    {row.original.diagnosticoLogistico.origem.provedor}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            id: "problemasLogisticos",
            header: "Problemas",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <ul className="max-w-72 space-y-1 text-xs text-amber-800">
                {row.original.diagnosticoLogistico?.problemas.map(
                  (problema) => (
                    <li key={problema.codigo}>{problema.mensagemAdmin}</li>
                  ),
                )}
              </ul>
            ),
          },
          {
            accessorKey: "weight",
            header: "Peso",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <span className="text-xs">
                {formatarMedida(row.original.weight, "g")}
              </span>
            ),
          },
          {
            accessorKey: "height",
            header: "Altura",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <span className="text-xs">
                {formatarMedida(row.original.height, "cm")}
              </span>
            ),
          },
          {
            accessorKey: "width",
            header: "Largura",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <span className="text-xs">
                {formatarMedida(row.original.width, "cm")}
              </span>
            ),
          },
          {
            accessorKey: "length",
            header: "Comprimento",
            cell: ({ row }: CellContext<Product, unknown>) => (
              <span className="text-xs">
                {formatarMedida(row.original.length, "cm")}
              </span>
            ),
          },
        ] satisfies ColumnDef<Product>[])
      : []),
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
        <div className="flex flex-col items-start gap-1.5">
          <SeloSituacaoPublicacao
            status={row.original.status}
            isActive={row.original.isActive}
            storeProductFlags={row.original.storeProductFlags}
          />
          {row.original.diagnosticoLogistico?.valido === false ? (
            <Badge variant="warning">Bloqueado pela logística</Badge>
          ) : null}
        </div>
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
                {somenteProblemasLogisticos
                  ? "Produtos com problema logístico"
                  : "Lista de Produtos"}
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

          {somenteProblemasLogisticos ? (
            <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:mb-6">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                Estes produtos permanecem cadastrados, mas não ficam disponíveis
                para novas compras até que os dados necessários ao envio sejam
                corrigidos.
              </p>
            </div>
          ) : null}

          <div
            className={`min-w-0 ${somenteProblemasLogisticos ? "[&_[data-slot=table]]:min-w-[92rem]" : "[&_[data-slot=table]]:min-w-[38rem]"}`}
          >
            <DataTable
              columns={columns}
              data={filteredProducts}
              colunasPesquisaveis={["name", "sku"]}
              onDeleteSelected={handleDeleteSelected}
              filtroExtra={
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {somenteProblemasLogisticos ? (
                    <>
                      <label
                        className="sr-only"
                        htmlFor="filtro-origem-logistica"
                      >
                        Filtrar por origem ou fornecedor
                      </label>
                      <select
                        id="filtro-origem-logistica"
                        value={origemSelecionada}
                        onChange={(evento) =>
                          setOrigemSelecionada(evento.target.value)
                        }
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                      >
                        <option value="">Todas as origens</option>
                        {origensDisponiveis.map(([chave, rotulo]) => (
                          <option key={chave} value={chave}>
                            {rotulo}
                          </option>
                        ))}
                      </select>

                      <label
                        className="sr-only"
                        htmlFor="filtro-problema-logistica"
                      >
                        Filtrar por tipo de problema
                      </label>
                      <select
                        id="filtro-problema-logistica"
                        value={problemaSelecionado}
                        onChange={(evento) =>
                          setProblemaSelecionado(evento.target.value)
                        }
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none"
                      >
                        <option value="">Todos os problemas</option>
                        {problemasDisponiveis.map(([codigo, rotulo]) => (
                          <option key={codigo} value={codigo}>
                            {rotulo}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}

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
                </div>
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">
            Carregando produtos...
          </p>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
