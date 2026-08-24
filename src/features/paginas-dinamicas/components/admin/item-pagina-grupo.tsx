"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { GrupoNavegacaoComPaginas } from "../../types/paginas-dinamicas.types";

type Vinculo = GrupoNavegacaoComPaginas["paginas"][number];
type Propriedades = {
  vinculo: Vinculo;
  indice: number;
  total: number;
  ocupado: boolean;
  aoEditar: () => void;
  aoRemover: () => void;
  aoMover: (direcao: -1 | 1) => void;
};

const statusPagina = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  arquivada: "Arquivada",
} as const;

export function ItemPaginaGrupo({
  vinculo,
  indice,
  total,
  ocupado,
  aoEditar,
  aoRemover,
  aoMover,
}: Propriedades) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vinculo.paginaId, disabled: ocupado });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
        isDragging ? "ring-primary/30 bg-background z-10 shadow-lg ring-2" : ""
      }`}
    >
      <button
        type="button"
        className="text-muted-foreground focus-visible:ring-ring flex size-9 cursor-grab items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        aria-label={`Reordenar ${vinculo.pagina.titulo}`}
        disabled={ocupado}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">
            {vinculo.textoLink || vinculo.pagina.titulo}
          </p>
          <Badge
            variant={
              vinculo.pagina.status === "publicada" ? "default" : "secondary"
            }
          >
            {statusPagina[vinculo.pagina.status]}
          </Badge>
          {!vinculo.ativo ? (
            <Badge variant="outline">Vínculo inativo</Badge>
          ) : null}
        </div>
        {vinculo.textoLink ? (
          <p className="text-muted-foreground mt-1 text-xs">
            Página: {vinculo.pagina.titulo}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Mover ${vinculo.pagina.titulo} para cima`}
          disabled={ocupado || indice === 0}
          onClick={() => aoMover(-1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Mover ${vinculo.pagina.titulo} para baixo`}
          disabled={ocupado || indice === total - 1}
          onClick={() => aoMover(1)}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Editar vínculo de ${vinculo.pagina.titulo}`}
          disabled={ocupado}
          onClick={aoEditar}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Remover ${vinculo.pagina.titulo} do grupo`}
          disabled={ocupado}
          onClick={aoRemover}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
