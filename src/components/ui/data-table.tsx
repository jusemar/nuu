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
  Header,
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

import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { CSSProperties } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDeleteSelected?: (selectedRows: TData[]) => void
  actionsContent?: (row: TData) => React.ReactNode // ← NOVO SLOT
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteSelected,
  actionsContent // ← NOVA PROP
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // columnOrder inicial a partir das colunas passadas
  const initialOrder = React.useMemo(() => {
    return columns.map((c) => c.id ?? String((c as any).accessorKey ?? ""))
  }, [columns])

  const [columnOrder, setColumnOrder] = React.useState<string[]>(initialOrder)

  // Listener global para limpar seleção (usado pelo fluxo de exclusão)
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
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
  })

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id))
        const newIndex = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        {/* Bulk Actions - Aparece só quando tem linhas selecionadas */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center gap-2">
            {/* BOTÃO EXCLUIR */}
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

            {/* DROPDOWN DE AÇÕES */}
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

        {/* Filtro */}
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
          {/* Header com DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {/* Checkbox select-all head cell */}
                    <TableHead>
                      <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                      />
                    </TableHead>

                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader key={header.id} header={header as Header<TData, unknown>} />
                    ))}

                    {/* Cabeçalho da coluna Ações - só aparece se actionsContent existir */}
                    {actionsContent && <TableHead>Ações</TableHead>}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
          </DndContext>

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

                  {/* Coluna Ações - só aparece se actionsContent existir */}
                  {actionsContent && (
                    <TableCell>
                      <div className="flex gap-1">
                        <div className="opacity-40 group-hover:opacity-0 transition-opacity duration-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>

                        <div className="absolute gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
                          {actionsContent(row.original)}
                        </div>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actionsContent ? 2 : 1)} 
                  className="h-24 text-center"
                >
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

/* Draggable header component */
const DraggableTableHeader = ({ header }: { header: Header<any, unknown> }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition,
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 10 : 0
  }

  return (
    <TableHead
      ref={setNodeRef}
      className='before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent'
      style={style}
      aria-sort={
        header.column.getIsSorted() === 'asc'
          ? 'ascending'
          : header.column.getIsSorted() === 'desc'
            ? 'descending'
            : 'none'
      }
    >
      <div className='flex items-center justify-start gap-0.5'>
        <Button
          size='icon'
          variant='ghost'
          className='-ml-2 size-7 shadow-none'
          {...attributes}
          {...listeners}
          aria-label='Drag to reorder'
        >
          {/* small grab handle */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M10 6H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Button>
        <span className='grow truncate'>
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        <Button
          size='icon'
          variant='ghost'
          className='group -mr-1 size-7 shadow-none'
          onClick={header.column.getToggleSortingHandler()}
          onKeyDown={e => {
            if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              header.column.getToggleSortingHandler()?.(e)
            }
          }}
          aria-label='Toggle sorting'
        >
          <ArrowUpDown className='shrink-0 opacity-60' size={16} aria-hidden='true' />
        </Button>
      </div>
    </TableHead>
  )
}