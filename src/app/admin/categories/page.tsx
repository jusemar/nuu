"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, ChevronDown, MoreHorizontal } from "lucide-react"
import { Toolbar } from "@/components/admin/toolbar"
import { useState } from "react"

export default function CategoriesPage() {
  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "subcategories",
      header: "Subcategorias",
      cell: ({ row }: { row: any }) => {
        const count = row.getValue("subcategories")
        return (
          <Badge variant="secondary">
            {count} subcategoria(s)
          </Badge>
        )
      }
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }: { row: any }) => {
        const count = row.getValue("tags")
        return (
          <Badge variant="outline">
            {count} tag(s)
          </Badge>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        const status = row.getValue("status")
        const isActive = status === "active"
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        )
      }
    }    
  ]

  // Dados temporários para teste
  const testData = [
    {
      id: 1,
      name: "Eletrônicos",
      subcategories: 5,
      tags: 10,
      status: "active"
    },
    {
      id: 2, 
      name: "Roupas",
      subcategories: 3,
      tags: 25,
      status: "active"
    }
  ]
  const [columnVisibility, setColumnVisibility] = useState({})

  const toolbarColumns = [
    {
      id: "name",
      label: "Nome",
      visible: true,
      toggleVisibility: (visible: boolean) => setColumnVisibility(prev => ({...prev, name: !visible}))
    },
    {
      id: "subcategories", 
      label: "Subcategorias",
      visible: true,
      toggleVisibility: (visible: boolean) => setColumnVisibility(prev => ({...prev, subcategories: !visible}))
    },
    {
      id: "tags",
      label: "Tags", 
      visible: true,
      toggleVisibility: (visible: boolean) => setColumnVisibility(prev => ({...prev, tags: !visible}))
    },
    {
      id: "status",
      label: "Status",
      visible: true, 
      toggleVisibility: (visible: boolean) => setColumnVisibility(prev => ({...prev, status: !visible}))
    }
  ]

  return (   
    
  <div className="flex flex-1 flex-col gap-2">
    {/* Header da página */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-muted-foreground">Gerencie as categorias da sua loja</p>
      </div>
      <Button asChild>
        <Link href="/admin/categories/new">
          ＋ Nova Categoria
        </Link>
      </Button>
    </div>
    {/* DataTable */}
    <DataTable columns={columns} data={testData} />
  </div>
)
  
}