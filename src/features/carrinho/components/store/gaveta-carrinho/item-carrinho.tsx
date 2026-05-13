import { Loader2, Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatarPrecoCarrinho } from "../../../lib/formatar-preco-carrinho";
import type { ItemCarrinho as ItemCarrinhoTipo } from "../../../types/carrinho.types";
import { ControleQuantidadeCarrinho } from "./controle-quantidade-carrinho";

type ItemCarrinhoProps = {
  item: ItemCarrinhoTipo;
  atualizando?: boolean;
  onAumentar: () => void;
  onDiminuir: () => void;
  onRemover: () => void;
};

export function ItemCarrinho({
  item,
  atualizando,
  onAumentar,
  onDiminuir,
  onRemover,
}: ItemCarrinhoProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[84px_1fr] gap-4 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/70",
        atualizando && "opacity-70",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          fill
          alt={item.nome}
          className="object-contain p-2"
          sizes="84px"
          src={item.imagemUrl || "/produto-sem-foto.webp"}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-zinc-950 dark:text-zinc-50">
              {item.nome}
            </h3>

            {item.variante ? (
              <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {item.variante}
              </p>
            ) : null}
          </div>

          <Button
            aria-label="Remover item"
            className="size-8 shrink-0 rounded-md text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            disabled={atualizando}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onRemover}
          >
            {atualizando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <ControleQuantidadeCarrinho
            desabilitado={atualizando}
            quantidade={item.quantidade}
            onAumentar={onAumentar}
            onDiminuir={onDiminuir}
          />

          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {formatarPrecoCarrinho(item.precoEmCentavos * item.quantidade)}
          </p>
        </div>
      </div>
    </article>
  );
}
