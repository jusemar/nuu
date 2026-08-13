"use client";

import { CheckboxFornecedor } from "./checkbox-fornecedor";

type SelecaoPaginaFornecedorProps = {
  total: number;
  selecionados: number;
  aoAlterar: (selecionado: boolean) => void;
  className?: string;
};

/** Usa a mesma seleção da tabela para expor o checkbox mestre no mobile. */
export function SelecaoPaginaFornecedor({
  total,
  selecionados,
  aoAlterar,
  className,
}: SelecaoPaginaFornecedorProps) {
  if (total === 0) return null;

  const estado =
    selecionados === total ? true : selecionados > 0 ? "indeterminate" : false;

  return (
    <label
      className={`flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-xs ${className ?? ""}`}
    >
      <CheckboxFornecedor
        checked={estado}
        onCheckedChange={(valor) => aoAlterar(valor === true)}
        aria-label={`Selecionar os ${total} desta página`}
      />
      <span className="min-w-0 break-words">
        Selecionar os {total} desta página
      </span>
    </label>
  );
}
