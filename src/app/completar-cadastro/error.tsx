"use client";

import { Button } from "@/components/ui/button";

export default function CompletarCadastroError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">
          Não foi possível carregar o cadastro
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tente novamente para continuar sua conta.
        </p>
        <Button onClick={reset} className="mt-5">
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
