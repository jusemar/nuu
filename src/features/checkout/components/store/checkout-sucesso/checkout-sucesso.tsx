"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCarrinho } from "@/features/carrinho";

export function CheckoutSucesso() {
  const { limparCarrinho } = useCarrinho();

  useEffect(() => {
    limparCarrinho();
  }, [limparCarrinho]);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center px-4 py-12">
      <section className="w-full rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Pedido recebido
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          O pagamento foi confirmado pelo Stripe. Enviaremos os próximos
          detalhes para o e-mail informado no checkout.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="rounded-md" asChild>
            <Link href="/">Voltar para a loja</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
