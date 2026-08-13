"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PainelFiltrosResponsivoProps = {
  children: ReactNode;
  quantidadeAtivos?: number;
  className?: string;
  titulo?: string;
};

/**
 * Mantém os filtros abertos no desktop e recolhidos no celular.
 * O conteúdo permanece montado para preservar os valores atuais dos campos.
 */
export function PainelFiltrosResponsivo({
  children,
  quantidadeAtivos = 0,
  className,
  titulo = "Filtros",
}: PainelFiltrosResponsivoProps) {
  const [aberto, setAberto] = useState(false);
  const possuiFiltrosAtivos = quantidadeAtivos > 0;

  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-xs",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between rounded-lg px-3 py-2.5 md:hidden"
        aria-expanded={aberto}
        onClick={() => setAberto((estadoAtual) => !estadoAtual)}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
          <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
          {titulo}
          {possuiFiltrosAtivos ? (
            <Badge className="h-5 min-w-5 justify-center bg-slate-900 px-1.5 text-[11px] text-white hover:bg-slate-900">
              {quantidadeAtivos}
            </Badge>
          ) : (
            <span className="font-normal text-slate-500">Nenhum ativo</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            aberto && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Button>

      <div className={cn(aberto ? "block" : "hidden", "md:block")}>
        {children}
      </div>
    </section>
  );
}
