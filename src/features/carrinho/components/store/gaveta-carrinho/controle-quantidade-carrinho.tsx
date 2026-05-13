import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type ControleQuantidadeCarrinhoProps = {
  quantidade: number;
  desabilitado?: boolean;
  onAumentar: () => void;
  onDiminuir: () => void;
};

export function ControleQuantidadeCarrinho({
  quantidade,
  desabilitado,
  onAumentar,
  onDiminuir,
}: ControleQuantidadeCarrinhoProps) {
  return (
    <div className="flex h-9 w-[112px] items-center justify-between rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
      <Button
        aria-label="Diminuir quantidade"
        className="size-7 rounded-sm"
        disabled={desabilitado}
        size="icon"
        type="button"
        variant="ghost"
        onClick={onDiminuir}
      >
        <Minus className="size-3.5" />
      </Button>

      <span className="min-w-6 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {quantidade}
      </span>

      <Button
        aria-label="Aumentar quantidade"
        className="size-7 rounded-sm"
        disabled={desabilitado}
        size="icon"
        type="button"
        variant="ghost"
        onClick={onAumentar}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
