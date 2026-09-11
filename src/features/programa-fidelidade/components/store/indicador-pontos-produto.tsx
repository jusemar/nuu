import { Coins } from "lucide-react";
import React from "react";

import { formatarPontosProdutoVitrine } from "../../lib/calcular-pontos-vitrine";

export function IndicadorPontosProduto({
  pontos,
  contexto = "card",
}: {
  pontos?: string | null;
  contexto?: "card" | "pdp";
}) {
  if (!pontos) return null;

  const pontosFormatados = formatarPontosProdutoVitrine(pontos);

  if (contexto === "pdp") {
    return (
      <div className="bg-primary-light text-primary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold">
        <Coins className="size-4 shrink-0" aria-hidden />
        <span>Ganhe {pontosFormatados} pontos nesta compra</span>
      </div>
    );
  }

  return (
    <p className="text-primary mt-1 flex items-center gap-1 text-[11px] font-semibold">
      <Coins className="size-3 shrink-0" aria-hidden />
      <span>Ganhe {pontosFormatados} pts</span>
    </p>
  );
}
