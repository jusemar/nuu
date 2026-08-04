"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function TreinamentoAtendenteIaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div
        role="alert"
        className="bg-card w-full max-w-lg rounded-xl border p-6 text-center shadow-sm"
      >
        <span className="bg-destructive/10 text-destructive mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold">
          Não foi possível carregar o treinamento
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Ocorreu uma falha inesperada nesta prévia. Nenhum conteúdo ou
          atendimento foi alterado.
        </p>
        <Button className="mt-5" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
