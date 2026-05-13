import { ShoppingBag } from "lucide-react";

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CabecalhoGavetaCarrinhoProps = {
  quantidadeTotal: number;
};

export function CabecalhoGavetaCarrinho({
  quantidadeTotal,
}: CabecalhoGavetaCarrinhoProps) {
  const descricao =
    quantidadeTotal === 1
      ? "1 item selecionado"
      : `${quantidadeTotal} itens selecionados`;

  return (
    <SheetHeader className="border-b border-zinc-200 px-5 py-5 text-left dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <ShoppingBag className="size-5" />
        </div>

        <div>
          <SheetTitle className="text-base font-semibold tracking-normal text-zinc-950 dark:text-zinc-50">
            Seu Carrinho
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {descricao}
          </SheetDescription>
        </div>
      </div>
    </SheetHeader>
  );
}
