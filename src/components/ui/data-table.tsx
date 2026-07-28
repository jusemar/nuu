"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Header,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react";
import type { CSSProperties } from "react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDeleteSelected?: (selectedRows: TData[]) => void;
  actionsContent?: (row: TData) => React.ReactNode; // ← NOVO SLOT
  filtroExtra?: React.ReactNode;
  colunasPesquisaveis?: string[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteSelected,
  actionsContent, // ← NOVA PROP
  filtroExtra,
  colunasPesquisaveis,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filtroGlobal, setFiltroGlobal] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});

  // columnOrder inicial a partir das colunas passadas
  const initialOrder = React.useMemo(() => {
    return columns.map((coluna) => {
      const colunaComAcessor = coluna as ColumnDef<TData, TValue> & {
        accessorKey?: string;
      };
      return coluna.id ?? String(colunaComAcessor.accessorKey ?? "");
    });
  }, [columns]);

  const [columnOrder, setColumnOrder] = React.useState<string[]>(initialOrder);
  const identificadorColunaFiltro = initialOrder.includes("name")
    ? "name"
    : initialOrder[0];
  const identificadoresColunasPesquisaveis =
    colunasPesquisaveis ??
    (identificadorColunaFiltro ? [identificadorColunaFiltro] : []);

  // Listener global para limpar seleção (usado pelo fluxo de exclusão)
  React.useEffect(() => {
    function clearSelection() {
      setRowSelection({});
    }
    window.addEventListener("clearSelection", clearSelection);
    return () => window.removeEventListener("clearSelection", clearSelection);
  }, []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltroGlobal,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, valorFiltro) => {
      const busca = String(valorFiltro).toLocaleLowerCase("pt-BR");

      return identificadoresColunasPesquisaveis.some((identificador) =>
        String(row.getValue(identificador) ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(busca),
      );
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting,
      globalFilter: filtroGlobal,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="w-full">
      <div className="flex min-w-0 flex-wrap items-center gap-2 py-4">
        {/* Bulk Actions - Aparece só quando tem linhas selecionadas */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {/* BOTÃO EXCLUIR */}
            <Button
              variant="destructive"
              onClick={() => {
                const selectedCount =
                  table.getFilteredSelectedRowModel().rows.length;
                if (
                  confirm(
                    `Tem certeza que deseja excluir ${selectedCount} item(ns) selecionado(s)?`,
                  )
                ) {
                  onDeleteSelected?.(
                    table
                      .getFilteredSelectedRowModel()
                      .rows.map((row) => row.original),
                  );
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
        <div className="relative min-w-0 flex-1 basis-56 sm:max-w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Filtrar..."
            value={filtroGlobal}
            onChange={(event) => setFiltroGlobal(event.target.value)}
            className="bg-background border-input pl-10"
          />
        </div>

        {filtroExtra}

        {/* Colunas - Mantém igual mas com ml-auto */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:ml-auto">
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
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="max-w-full overflow-hidden rounded-md border">
        {/* DndContext MOVIDO PARA FORA da tabela */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {/* Checkbox select-all head cell */}
                    <TableHead>
                      <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) =>
                          table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                      />
                    </TableHead>

                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader
                        key={header.id}
                        header={header as Header<TData, unknown>}
                      />
                    ))}

                    {/* Cabeçalho da coluna Ações - só aparece se actionsContent existir */}
                    {actionsContent && <TableHead>Ações</TableHead>}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group transition-colors duration-150 hover:bg-blue-50/30"
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}

                    {/* Coluna Ações - só aparece se actionsContent existir */}
                    {actionsContent && (
                      <TableCell>
                        <div className="flex gap-1">
                          <div className="opacity-40 transition-opacity duration-200 group-hover:opacity-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>

                          <div className="absolute flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
        </DndContext>
      </div>

      <div className="flex flex-col gap-3 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm sm:flex-1">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end lg:gap-6">
          <div className="flex items-center gap-2">
            <p className="hidden text-sm font-medium sm:block">
              Linhas por página
            </p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border-input bg-background h-8 w-[70px] rounded-md border"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
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
  );
}

/* Draggable header component */
const DraggableTableHeader = <TData,>({
  header,
}: {
  header: Header<TData, unknown>;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Transform.toString(transform),
    transition,
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <TableHead
      ref={setNodeRef}
      className="before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent"
      style={style}
      aria-sort={
        header.column.getIsSorted() === "asc"
          ? "ascending"
          : header.column.getIsSorted() === "desc"
            ? "descending"
            : "none"
      }
    >
      <div className="flex items-center justify-start gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="-ml-2 size-7 shadow-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          {/* small grab handle */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M10 6H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 12H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 18H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Button>
        <span className="grow truncate">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="group -mr-1 size-7 shadow-none"
          onClick={header.column.getToggleSortingHandler()}
          onKeyDown={(e) => {
            if (
              header.column.getCanSort() &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              header.column.getToggleSortingHandler()?.(e);
            }
          }}
          aria-label="Toggle sorting"
        >
          <ArrowUpDown
            className="shrink-0 opacity-60"
            size={16}
            aria-hidden="true"
          />
        </Button>
      </div>
    </TableHead>
  );
};
