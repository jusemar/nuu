import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

import { NavegacaoTreinamento } from "./navegacao-treinamento";

type EstruturaPaginaTreinamentoProps = {
  children: ReactNode;
  descricao: string;
  titulo: string;
};

export function EstruturaPaginaTreinamento({
  children,
  descricao,
  titulo,
}: EstruturaPaginaTreinamentoProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl space-y-1">
            <p className="text-primary text-sm font-semibold">Atendente IA</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {titulo}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {descricao}
            </p>
          </div>
          <Badge variant="outline" className="bg-background py-1.5">
            Prévia com dados controlados
          </Badge>
        </div>
        <NavegacaoTreinamento />
      </header>
      {children}
    </div>
  );
}
