"use client";

import { ListChecks, WandSparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BarraSelecaoProdutosProps = {
  quantidade: number;
  onLimpar: () => void;
  onConfigurar: () => void;
};

export function BarraSelecaoProdutos({
  quantidade,
  onLimpar,
  onConfigurar,
}: BarraSelecaoProdutosProps) {
  if (quantidade === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="bg-popover pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border p-3 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-950">
          <ListChecks className="size-4 text-blue-700" />
          <strong>{quantidade}</strong>
          <span>selecionado(s)</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7 sm:ml-1"
            onClick={onLimpar}
            aria-label="Limpar seleção"
          >
            <X className="size-4" />
          </Button>
        </div>
        <Button className="sm:ml-auto" onClick={onConfigurar}>
          <WandSparkles className="size-4" />
          Configurar alterações
        </Button>
      </div>
    </div>
  );
}
