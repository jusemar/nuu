import type { PrecoProdutoCalculado } from "@/features/precificacao";

export type PromocaoVisualPdp = {
  ativa: boolean;
  precoOriginalFormatado: string;
  precoPromocionalFormatado: string;
  economiaFormatada: string;
  percentualOff: number;
  tipoDesconto: "percentual" | "valor_fixo" | null;
};

function formatarCentavos(valorEmCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

export function formatarPromocaoPrecoPdp(
  precoCalculado: PrecoProdutoCalculado | null | undefined,
): PromocaoVisualPdp | null {
  const promocao = precoCalculado?.promocao;

  if (!promocao?.ativa || promocao.descontoAplicadoEmCentavos <= 0) {
    return null;
  }

  const percentualOff =
    promocao.precoOriginalEmCentavos > 0
      ? Math.round(
          (promocao.descontoAplicadoEmCentavos /
            promocao.precoOriginalEmCentavos) *
            100,
        )
      : 0;

  return {
    ativa: true,
    precoOriginalFormatado: formatarCentavos(promocao.precoOriginalEmCentavos),
    precoPromocionalFormatado: formatarCentavos(promocao.precoFinalEmCentavos),
    economiaFormatada: formatarCentavos(promocao.descontoAplicadoEmCentavos),
    percentualOff,
    tipoDesconto: promocao.tipoDesconto,
  };
}
