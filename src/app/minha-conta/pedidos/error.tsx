"use client";

import { Button } from "@/components/ui/button";

export default function MeusPedidosError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Não foi possível carregar seus pedidos
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tente novamente em alguns instantes.
        </p>
        <Button className="mt-5" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
