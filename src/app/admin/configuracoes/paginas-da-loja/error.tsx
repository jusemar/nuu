"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErroPaginasDaLoja({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-14 text-center">
        <AlertCircle className="text-destructive mb-4 size-10" />
        <h1 className="text-lg font-semibold">
          Não foi possível carregar os grupos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tente novamente. Se o problema continuar, verifique a conexão do
          painel.
        </p>
        <Button className="mt-5" onClick={reset}>
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
