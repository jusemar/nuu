"use client";

import {
  BadgePercent,
  Check,
  Package,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECOES_LOJA } from "@/features/products/constants/secoes-loja";

interface StoreProductFlagsProps {
  value: string[];
  onChange: (flags: string[]) => void;
  disabled?: boolean;
}

const ICONES_SECOES = {
  general: Package,
  new: Sparkles,
  sale: BadgePercent,
  featured: Star,
  bestseller: Trophy,
} as const;

export function StoreProductFlags({
  value,
  onChange,
  disabled = false,
}: StoreProductFlagsProps) {
  function alternarSecao(secaoId: string) {
    if (disabled) return;

    onChange(
      value.includes(secaoId)
        ? value.filter((flag) => flag !== secaoId)
        : [...value, secaoId],
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-1 px-4 py-3 sm:px-5">
        <CardTitle className="text-base font-semibold">
          Seções da Loja
        </CardTitle>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Escolha onde o produto será exibido. É possível selecionar mais de uma
          opção.
        </p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-2 px-4 pt-0 pb-4 sm:grid-cols-2 sm:px-5">
        {SECOES_LOJA.map((secao) => {
          const selecionada = value.includes(secao.id);
          const indisponivel = "indisponivel" in secao && secao.indisponivel;
          const Icone = ICONES_SECOES[secao.id];

          return (
            <button
              key={secao.id}
              type="button"
              role="checkbox"
              aria-checked={selecionada}
              aria-disabled={disabled || indisponivel}
              disabled={disabled || indisponivel}
              onClick={() => alternarSecao(secao.id)}
              className={`focus-visible:ring-ring flex min-h-20 items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                selecionada
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/60"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                  selecionada
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                }`}
                aria-hidden="true"
              >
                {selecionada ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icone className="h-4 w-4" />
                )}
              </span>

              <span className="min-w-0 space-y-0.5">
                <span className="text-foreground block text-sm font-medium">
                  {secao.rotulo}
                </span>
                <span className="text-muted-foreground block text-xs leading-snug">
                  {secao.descricao}
                </span>
                {secao.id === "sale" && selecionada && (
                  <span
                    className="border-border text-foreground mt-1.5 block border-t pt-1.5 text-xs leading-snug"
                    role="status"
                  >
                    Exibe em Ofertas Especiais somente com Promoção Normal
                    válida na aba Modalidade de preços.
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
