"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  GripVertical,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { GrupoNavegacaoComPaginas } from "../../types/paginas-dinamicas.types";

type Propriedades = {
  grupo: GrupoNavegacaoComPaginas;
  indice: number;
  total: number;
  ocupado: boolean;
  aoEditar: () => void;
  aoGerenciarPaginas: () => void;
  aoAlterarAtivacao: () => void;
  aoMover: (direcao: -1 | 1) => void;
};

export function ItemGrupoNavegacao({
  grupo,
  indice,
  total,
  ocupado,
  aoEditar,
  aoGerenciarPaginas,
  aoAlterarAtivacao,
  aoMover,
}: Propriedades) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grupo.id, disabled: ocupado });
  const quantidade = grupo.paginas.length;

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        isDragging ? "ring-primary/30 z-10 shadow-lg ring-2" : undefined
      }
    >
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <button
          type="button"
          aria-label={`Reordenar ${grupo.nome}`}
          disabled={ocupado}
          className="text-muted-foreground focus-visible:ring-ring flex size-10 cursor-grab items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold">{grupo.nome}</h2>
            <Badge variant={grupo.ativo ? "default" : "secondary"}>
              {grupo.ativo ? "Ativo" : "Inativo"}
            </Badge>
            <Badge variant="outline">Rodapé</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">
              {grupo.tituloPublico}
            </span>{" "}
            · {grupo.identificador}
          </p>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <FileText className="size-3.5" />
            {quantidade}{" "}
            {quantidade === 1 ? "página vinculada" : "páginas vinculadas"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ocupado}
            onClick={aoGerenciarPaginas}
          >
            <FileText className="size-4" />
            Gerenciar páginas
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Mover ${grupo.nome} para cima`}
            disabled={ocupado || indice === 0}
            onClick={() => aoMover(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Mover ${grupo.nome} para baixo`}
            disabled={ocupado || indice === total - 1}
            onClick={() => aoMover(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Editar ${grupo.nome}`}
            disabled={ocupado}
            onClick={aoEditar}
          >
            <Pencil className="size-4" />
          </Button>
          <div className="ml-2 flex items-center gap-2 border-l pl-3">
            <span className="text-muted-foreground text-xs">
              {grupo.ativo ? "Ativo" : "Inativo"}
            </span>
            <Switch
              checked={grupo.ativo}
              disabled={ocupado}
              aria-label={`${grupo.ativo ? "Desativar" : "Ativar"} ${grupo.nome}`}
              onCheckedChange={aoAlterarAtivacao}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
