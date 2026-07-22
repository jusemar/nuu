"use client";

import { Truck } from "lucide-react";

import { usePrevisaoEntregaProdutoCard } from "../../hooks/use-previsao-entrega-produto-card";

export function PrevisaoEntregaProdutoCard({
  produtoId,
}: {
  produtoId: string;
}) {
  const { data: previsao } = usePrevisaoEntregaProdutoCard(produtoId);

  if (!previsao) return null;

  return (
    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
      <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{previsao}</span>
    </p>
  );
}
