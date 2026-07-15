"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductError({ error, reset }: ProductErrorProps) {
  useEffect(() => {
    // O detalhe técnico já foi registrado com segurança no servidor.
    console.error("Falha ao renderizar a página do produto", error.digest);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <AlertTriangle className="text-muted-foreground h-12 w-12" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Não foi possível carregar este produto
        </h1>
        <p className="text-muted-foreground">
          Tivemos uma instabilidade. Tente novamente em alguns instantes.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/">Voltar para a loja</Link>
        </Button>
      </div>
    </main>
  );
}
