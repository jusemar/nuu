import React from "react";

import type { PrecoModalidadeProduto } from "../../../types/alteracao-em-massa.types";
import { resumirPrecosProduto } from "../../../lib/alteracao-em-massa/resumir-precos-produto";

type CelulaPrecosProdutoProps = {
  precos: PrecoModalidadeProduto[];
};

/** Exibe todas as modalidades reais sem esconder informações em tooltip. */
export function CelulaPrecosProduto({ precos }: CelulaPrecosProdutoProps) {
  const precosExibicao = resumirPrecosProduto(precos);

  if (precosExibicao.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">
        Nenhum preço cadastrado
      </span>
    );
  }

  return (
    <div className="grid min-w-72 grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
      {precosExibicao.map((preco) => (
        <div
          key={preco.id}
          className="bg-muted/35 min-w-0 rounded-md border px-2.5 py-2"
        >
          <p className="text-muted-foreground truncate text-xs font-medium">
            {preco.rotulo}
          </p>
          <p className="mt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums">
            {preco.valorFormatado}
          </p>
          <p
            className="text-muted-foreground mt-0.5 truncate text-xs"
            title={preco.prazoFormatado}
          >
            {preco.prazoFormatado}
          </p>
        </div>
      ))}
    </div>
  );
}
