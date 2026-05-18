"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminOrderDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-950">
        Nao foi possivel carregar o pedido
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Ocorreu uma falha ao buscar os detalhes deste pedido.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">Voltar para pedidos</Link>
        </Button>
      </div>
    </div>
  );
}
