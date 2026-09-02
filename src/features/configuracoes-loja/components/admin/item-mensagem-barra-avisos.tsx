"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import type { DadosBarraAvisos } from "../../schemas/barra-avisos.schema";

type Props = {
  indice: number;
  identificadorOrdenacao: string;
  desabilitado: boolean;
  aoExcluir: () => void;
};

export function ItemMensagemBarraAvisos({
  indice,
  identificadorOrdenacao,
  desabilitado,
  aoExcluir,
}: Props) {
  const formulario = useFormContext<DadosBarraAvisos>();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: identificadorOrdenacao, disabled: desabilitado });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_5rem_minmax(0,1fr)_auto_auto] sm:items-end ${isDragging ? "ring-primary/30 bg-background z-10 shadow-lg ring-2" : ""}`}
    >
      <button
        type="button"
        className="text-muted-foreground focus-visible:ring-ring flex size-9 cursor-grab items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Reordenar mensagem ${indice + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <FormField
        control={formulario.control}
        name={`mensagens.${indice}.icone`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ícone</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                maxLength={16}
                placeholder="🚚"
                disabled={desabilitado}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={formulario.control}
        name={`mensagens.${indice}.texto`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Texto</FormLabel>
            <FormControl>
              <Input
                {...field}
                maxLength={180}
                placeholder="Digite o aviso"
                disabled={desabilitado}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={formulario.control}
        name={`mensagens.${indice}.ativo`}
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 pb-2">
            <FormLabel className="mb-0">Ativa</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={desabilitado}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Excluir mensagem ${indice + 1}`}
        onClick={aoExcluir}
        disabled={desabilitado}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
