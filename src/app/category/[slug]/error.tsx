"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falha ao carregar página de categoria", {
      digest: error.digest,
      tipo: error.name,
    });
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          Não foi possível carregar esta categoria
        </h1>
        <p className="text-muted-foreground">
          A loja está temporariamente indisponível. Tente novamente em alguns
          instantes.
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
