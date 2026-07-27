import React from "react";

type PromocaoPrecoProdutoPdp = {
  ativa: boolean;
  precoOriginalFormatado: string;
  precoPromocionalFormatado: string;
  economiaFormatada: string;
  percentualOff: number;
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
      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold tracking-wider uppercase">
          Desconto promocional aplicado
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs text-emerald-800 line-through">
            {promocao.precoOriginalFormatado}
          </span>
          <span className="text-lg font-extrabold">
            {promocao.precoPromocionalFormatado}
          </span>
          {promocao.percentualOff > 0 ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {promocao.percentualOff}% OFF
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-emerald-800">
          Economia de {promocao.economiaFormatada}.
        </p>
      </div>
    </section>
  );
}
