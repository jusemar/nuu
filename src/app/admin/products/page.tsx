"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { useProducts } from "@/hooks/admin/queries/use-products"
import { useState } from "react"
import { useProductBulkActions } from "@/hooks/admin/mutations/products/useProductBulkActions"

const { handleDeleteSelected } = useProductBulkActions()

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
  const [searchTerm, setSearchTerm] = useState("")

  // Filtro simples por nome
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: any }) => (
        <div className="font-medium">{row.getValue("name")}</div>
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
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-gray-600">{row.getValue("slug")}</span>
      )
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {row.getValue("description")}
        </span>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.getValue("createdAt"))
        return <span className="text-sm text-gray-600">{date.toLocaleDateString('pt-BR')}</span>
      }
    },   
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

      {/* LINHA DE FILTROS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Todas as categorias</option>
          </select>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Aplicar Filtros
          </button>
          
          <button 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => setSearchTerm("")}
          >
            Limpar
          </button>
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
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Link>
            </Button>
          </div>
          
          <DataTable 
            columns={columns} 
            data={filteredProducts}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
      </div>
    </div>
  )
}