import { BadgePercent } from "lucide-react";
import React from "react";

type PromocaoPrecoProdutoPdp = {
  ativa: boolean;
  precoOriginalFormatado: string;
  precoPromocionalFormatado: string;
  economiaFormatada: string;
  percentualOff: number;
  rotuloDesconto: string;
};

type BannerPromocaoProdutoPdpProps = {
  promocao: PromocaoPrecoProdutoPdp | null | undefined;
};

/** Exibe somente o desconto oficial já calculado pelo Promotion Engine. */
export function BannerPromocaoProdutoPdp({
  promocao,
}: BannerPromocaoProdutoPdpProps) {
  if (!promocao?.ativa) return null;

  return (
    <section
      aria-label="Desconto promocional no produto"
      data-pdp-promocao-real="true"
      className="border-accent-brand/30 bg-accent-brand-light flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm"
    >
      <span className="bg-accent-brand/15 text-accent-brand-dark flex size-9 shrink-0 items-center justify-center rounded-full">
        <BadgePercent aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-accent-brand-dark text-[11px] font-extrabold tracking-wider uppercase">
          Desconto promocional aplicado
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-muted-foreground text-xs line-through">
            {promocao.precoOriginalFormatado}
          </span>
          <span className="text-foreground text-lg font-extrabold">
            {promocao.precoPromocionalFormatado}
          </span>
          {promocao.rotuloDesconto ? (
            <span className="bg-accent-brand text-foreground rounded-full px-2 py-0.5 text-[10px] font-extrabold">
              {promocao.rotuloDesconto}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Economia de {promocao.economiaFormatada}.
        </p>
      </div>
    </section>
  );
}
