"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DetalhePedidoClienteError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Não foi possível carregar o pedido
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tente novamente em alguns instantes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button variant="outline" asChild>
            <Link href="/minha-conta/pedidos">Voltar aos pedidos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
