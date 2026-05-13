import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { formatarPrecoCarrinho } from "../../../lib/formatar-preco-carrinho";

type ResumoCarrinhoProps = {
  subtotalEmCentavos: number;
  onContinuarComprando: () => void;
};

export function ResumoCarrinho({
  subtotalEmCentavos,
  onContinuarComprando,
}: ResumoCarrinhoProps) {
  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
          <strong className="font-semibold text-zinc-950 dark:text-zinc-50">
            {formatarPrecoCarrinho(subtotalEmCentavos)}
          </strong>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Frete calculado no checkout
        </p>

        <Separator />

        <div className="grid gap-2">
          <Button className="h-11 w-full rounded-md" asChild>
            <Link href="/checkout">Finalizar compra</Link>
          </Button>

          <Button
            className="h-11 w-full rounded-md"
            type="button"
            variant="outline"
            onClick={onContinuarComprando}
          >
            Continuar comprando
          </Button>
        </div>
      </div>
    </footer>
  );
}
