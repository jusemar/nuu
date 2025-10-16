"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteSelected?: (selectedRows: TData[]) => void
}




export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteSelected
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})


  // Dentro do DataTable
React.useEffect(() => {
  function clearSelection() {
    setRowSelection({})
  }
  window.addEventListener("clearSelection", clearSelection)
  return () => window.removeEventListener("clearSelection", clearSelection)
}, [])



  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
     
      
<div className="flex items-center py-4 gap-2">

  {/* Bulk Actions - Aparece só quando tem linhas selecionadas */}
{table.getFilteredSelectedRowModel().rows.length > 0 && (
  <div className="flex items-center gap-2">
    {/* BOTÃO EXCLUIR QUE VAMOS ADICIONAR */}
     <Button 
      variant="destructive"
      onClick={() => {
        const selectedCount = table.getFilteredSelectedRowModel().rows.length
        if (confirm(`Tem certeza que deseja excluir ${selectedCount} item(ns) selecionado(s)?`)) {
          onDeleteSelected?.(table.getFilteredSelectedRowModel().rows.map(row => row.original))
        }
      }}
      >
        🗑️ Excluir ({table.getFilteredSelectedRowModel().rows.length})
      </Button>


         {/* DROPDOWN DE AÇÕES QUE JÁ EXISTIA - MANTEM */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      Ações ({table.getFilteredSelectedRowModel().rows.length})
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>✏️ Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>📧 Exportar</DropdownMenuItem>
    <DropdownMenuItem>🔔 Ativar</DropdownMenuItem>
    <DropdownMenuItem>🚫 Desativar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>


  </div>
)}


  {/* Filtro - Corrigido para filtrar por "name" */}
  <div className="relative w-80">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
     <Input
  placeholder="Filtrar..."
  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
  onChange={(event) => {
    const nameColumn = table.getColumn("name")
    if (nameColumn) {
      nameColumn.setFilterValue(event.target.value)
    }
  }}
  className="pl-10 bg-background border-input"
/>

  </div>

  {/* Colunas - Mantém igual mas com ml-auto */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="ml-auto">
        Colunas <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {table
        .getAllColumns()
        .filter((column) => column.getCanHide())
        .map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) =>
                column.toggleVisibility(!!value)
              }
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          )
        })}
    </DropdownMenuContent>
  </DropdownMenu>
</div>




      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead>
                  <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                  />
                </TableHead>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
                <TableHead>Ações</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
               <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-blue-50/30 transition-colors duration-150" 
                >
                  <TableCell>
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}

                 <TableCell>
  <div className="flex gap-1">
    {/* Ícone fixo discreto */}
    <div className="opacity-40 group-hover:opacity-0 transition-opacity duration-200">
      <MoreHorizontal className="h-4 w-4" />
    </div>
    
    {/* Ações que aparecem no hover */}
    <div className="absolute gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" title="Editar">
        ✏️
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600" title="Visualizar">
        👁️
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600" title="Estatísticas">
        📊
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Excluir">
        🗑️
      </Button>
    </div>
  </div>
</TableCell>

                </TableRow>
              ))
            ) : (

              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-24 text-center">
                  Nenhum resultado.
                </TableCell>
              </TableRow>

            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2 py-4">
  <div className="flex-1 text-sm text-muted-foreground">
    {table.getFilteredSelectedRowModel().rows.length} de{" "}
    {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
  </div>
  <div className="flex items-center space-x-6 lg:space-x-8">
    <div className="flex items-center space-x-2">
      <p className="text-sm font-medium">Linhas por página</p>
      <select
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
        className="h-8 w-[70px] rounded-md border border-input bg-background"
      >
        {[10, 20, 30, 40, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            {pageSize}
          </option>
        ))}
      </select>
    </div>
    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
      Página {table.getState().pagination.pageIndex + 1} de{" "}
      {table.getPageCount()}
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Próxima
      </Button>
    </div>
  </div>
</div>
     
    </div>
  )
}