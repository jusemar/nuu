import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

type CarrinhoVazioProps = {
  onContinuarComprando: () => void;
};

export function CarrinhoVazio({ onContinuarComprando }: CarrinhoVazioProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="mx-auto flex max-w-[280px] flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <ShoppingBag className="size-6" />
        </div>

        <h3 className="mt-5 text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Seu carrinho está vazio
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Adicione produtos para revisar sua compra por aqui.
        </p>

        <Button
          className="mt-6 h-10 rounded-md px-5"
          type="button"
          onClick={onContinuarComprando}
        >
          Continuar comprando
        </Button>
      </div>
    </div>
  );
}
