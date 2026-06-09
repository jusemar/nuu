"use client";

import type { ResultadoFreteGratisProgressivo } from "../../services";

type IndicadorFreteGratisProgressivoProps = {
  resultado: ResultadoFreteGratisProgressivo | null | undefined;
  formatarPreco: (valorEmCentavos: number) => string;
};

export function IndicadorFreteGratisProgressivo({
  resultado,
  formatarPreco,
}: IndicadorFreteGratisProgressivoProps) {
  if (!resultado?.ativo || !resultado.subtotalMinimoEmCentavos) {
    return null;
  }

  const valorFaltanteFormatado = formatarPreco(resultado.faltanteEmCentavos);
  const mensagemConfigurada = resultado.mensagem?.replace(
    "{valor}",
    valorFaltanteFormatado,
  );
  const mensagem = resultado.atingido
    ? "Frete grátis desbloqueado."
    : (mensagemConfigurada ??
      `Faltam ${valorFaltanteFormatado} para frete grátis.`);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">
          {resultado.atingido ? "Frete grátis liberado" : "Frete grátis"}
        </span>
        <span className="font-semibold">{resultado.percentualProgresso}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-emerald-950">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${resultado.percentualProgresso}%` }}
        />
      </div>
      <p className="mt-2 leading-4">{mensagem}</p>
      {!resultado.atingido ? (
        <p className="mt-1 text-emerald-800 dark:text-emerald-200">
          Meta: {formatarPreco(resultado.subtotalMinimoEmCentavos)}
        </p>
      ) : null}
    </div>
  );
}
