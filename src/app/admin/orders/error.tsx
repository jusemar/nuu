"use client";

import { Button } from "@/components/ui/button";

export default function AdminOrdersError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-950">
        Nao foi possivel carregar os pedidos
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Ocorreu uma falha ao buscar os dados operacionais. Tente novamente.
      </p>
      <Button className="mt-5" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
