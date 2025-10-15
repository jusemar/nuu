// src/app/admin/categories/page.tsx
"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { EditableCell } from "@/components/admin/editable-cell"
import { EditableSwitch } from "@/components/admin/editable-switch"


interface Category {
  id: string; // ⬅️ Mude para string (UUID)
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean; // ⬅️ Campo correto do banco
  createdAt: string;
  updatedAt: string;
}


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

 
  // Busca as categorias do banco
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('Dados do banco:', data); // ← ADICIONE ESTA LINHA
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchCategories();
}, []);

const columns = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }: { row: any }) => (
      <EditableCell
        value={row.getValue("name") || ""}
        onSave={(newValue) => console.log('Salvar nome:', { id: row.original.id, newValue })}
        placeholder="Sem nome"
      />
    )
  },
  {
    accessorKey: "slug", 
    header: "Slug",
    cell: ({ row }: { row: any }) => (
      <EditableCell
        value={row.getValue("slug") || ""}
        onSave={(newValue) => console.log('Salvar slug:', { id: row.original.id, newValue })}
        placeholder="Sem slug"
      />
    )
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }: { row: any }) => (
      <EditableCell
        value={row.getValue("description") || ""}
        onSave={(newValue) => console.log('Salvar descrição:', { id: row.original.id, newValue })}
        type="textarea"
        placeholder="Sem descrição"
      />
    )
  },
  
  {
    accessorKey: "metaTitle",
    header: "Meta Título",
    cell: ({ row }: { row: any }) => (
      <EditableCell
        value={row.getValue("metaTitle") || ""}
        onSave={(newValue) => console.log('Salvar metaTitle:', { id: row.original.id, newValue })}
        placeholder="Sem meta título"
      />
    )
  },
  {
    accessorKey: "metaDescription",
    header: "Meta Descrição",
    cell: ({ row }: { row: any }) => (
      <EditableCell
        value={row.getValue("metaDescription") || ""}
        onSave={(newValue) => console.log('Salvar metaDescription:', { id: row.original.id, newValue })}
        type="textarea"
        placeholder="Sem meta descrição"
      />
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }: { row: any }) => (
      <EditableSwitch
        value={row.getValue("isActive")}
        onSave={(newValue) => console.log('Alterar status:', { id: row.original.id, newValue })}
      />
    )
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString('pt-BR')}
        </span>
      )
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Última Atualização",
    cell: ({ row }: { row: any }) => {
      const date = new Date(row.getValue("updatedAt"))
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString('pt-BR')}
        </span>
      )
    }
  }
]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
        <div className="animate-pulse">Carregando categorias...</div>
      </div>
    )
  }

  return (    
    <div className="flex flex-1 flex-col gap-2">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            {categories.length} categoria(s) encontrada(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Link>
        </Button>
      </div>
      
      {/* DataTable com dados reais do banco */}
      <DataTable 
        columns={columns} 
        data={categories}         
      />
    </div>
  )
}