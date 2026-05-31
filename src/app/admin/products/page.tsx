"use client"

import Link from "next/link"
import { ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { EditableCell } from "@/components/admin/editable-cell"
import { useProducts } from "@/hooks/admin/queries/products/use-products"
import { useProductBulkActions } from "@/hooks/admin/mutations/products/useProductBulkActions"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { EditableSwitch } from "@/components/admin/editable-switch"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string | null;
  createdAt: Date;
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts()
  const { handleDeleteSelected } = useProductBulkActions()
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState("")
  const [buscaCategoria, setBuscaCategoria] = useState("")
  const [popoverCategoriaAberto, setPopoverCategoriaAberto] = useState(false)
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [originalProducts, setOriginalProducts] = useState<Product[]>([])

  const categoriasDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>()
    localProducts.forEach((produto) => {
      if (produto.categoryId && produto.categoryName) {
        mapa.set(produto.categoryId, produto.categoryName)
      }
    })
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [localProducts])

  const categoriaSelecionada = categoriasDisponiveis.find(
    (categoria) => categoria.id === categoriaSelecionadaId,
  )

  const categoriasFiltradas = categoriasDisponiveis.filter((categoria) =>
    categoria.nome.toLowerCase().includes(buscaCategoria.toLowerCase()),
  )

  const filteredProducts = localProducts.filter((product) => {
    const correspondeCategoria =
      !categoriaSelecionadaId || product.categoryId === categoriaSelecionadaId

    return correspondeCategoria
  })

  useEffect(() => {
    if (products) {
      setLocalProducts(products)
      setOriginalProducts(products)
    }
  }, [products])

  const updateLocalProduct = (id: string, field: string, value: any) => {
    setLocalProducts(prev => 
      prev.map(product => 
        product.id === id ? { ...product, [field]: value } : product
      )
    )
  }

  const hasChanges = useMemo(() => {
    if (localProducts.length !== originalProducts.length) return true;
    
    return localProducts.some((product, index) => {
      const original = originalProducts[index];
      if (!original) return true;
      
      return product.name !== original.name ||
             product.slug !== original.slug ||
             product.description !== original.description;
    });
  }, [localProducts, originalProducts])

  const saveChanges = () => {
    // Aqui você implementará a lógica de salvar no banco
    // Similar à função saveChanges das categorias
    toast.success("Alterações salvas com sucesso!", {
      style: {
        backgroundColor: "#22c55e",
        color: "#ffffff",
      },
    })
    setOriginalProducts(localProducts)
  }

  const cancelChanges = () => {
    setLocalProducts(originalProducts)
  }

  const columns = [
    {
    accessorKey: "sku",
    header: "SKU", 
    cell: ({ row }: { row: any }) => (
      <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
        {row.getValue("sku")}
      </span>
    )
  }, 
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }: { row: any }) => (
      <Link
        href={`/admin/products/${row.original.id}/edit`}
        className="font-medium text-gray-900 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {row.getValue("name")}
      </Link>
    )
  }, 
  {
    accessorKey: "categoryName", 
    header: "Categoria",
    cell: ({ row }: { row: any }) => (
      <span className="text-sm text-gray-600">
        {row.getValue("categoryName") || "Sem categoria"}
      </span>
    )
  },   
  /*status*/
 {
  accessorKey: "isActive",
  header: "Status",
  cell: ({ row }: { row: any }) => (
    <EditableSwitch
      value={row.getValue("isActive")}
      onSave={(newValue) => updateLocalProduct(row.original.id, "isActive", newValue)}
    />
  )
},

   {
    accessorKey: "brand",
    header: "Marca",
    cell: ({ row }: { row: any }) => (
      <span className="text-sm text-gray-600">
        {row.getValue("brand") || "—"}
      </span>
    )
  },
 
  {
    accessorKey: "updatedAt",
    header: "Última atualização",
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue("updatedAt"))
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString('pt-BR')} às {date.getHours()}:{date.getMinutes().toString().padStart(2, '0')}
        </span>
      )
    }
  },
   {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue("createdAt"))
      return <span className="text-sm text-gray-600">{date.toLocaleDateString('pt-BR')}</span>
    }
  }
]

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
      </div>
    )
  }

  return (    
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* TOPO - 3 CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{products?.length || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Com Categoria</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {products?.filter(p => p.categoryName).length || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sem Categoria</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {products?.filter(p => !p.categoryName).length || 0}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Plus className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Produtos</h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} produto(s)
              </p>
            </div>
            
            <div className="flex gap-2">
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
              <Button asChild>
                <Link href="/admin/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Link>
              </Button>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredProducts}
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
                    className="h-10 w-[280px] justify-between"
                  >
                    <span className="truncate">
                      {categoriaSelecionada?.nome || "Selecionar categoria"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2" align="start">
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
                        setCategoriaSelecionadaId("")
                        setPopoverCategoriaAberto(false)
                        setBuscaCategoria("")
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
                          setCategoriaSelecionadaId(categoria.id)
                          setPopoverCategoriaAberto(false)
                          setBuscaCategoria("")
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
              <Link href={`/admin/products/${row.id}/edit`}>
                ✏️
              </Link>
            )}
          />

        </div>
      </div>
    </div>
  )
}
