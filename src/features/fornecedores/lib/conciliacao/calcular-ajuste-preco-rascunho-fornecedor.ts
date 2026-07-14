export type OperacaoAjustePrecoRascunhoFornecedor =
  | "aumentar_percentual"
  | "diminuir_percentual"
  | "somar_valor_fixo"
  | "definir_valor_fixo";

export function calcularAjustePrecoRascunhoFornecedor({
  precoAtual,
  operacao,
  valor,
}: {
  precoAtual: string | number | null | undefined;
  operacao: OperacaoAjustePrecoRascunhoFornecedor;
  valor: number;
}) {
  if (!Number.isFinite(valor) || valor < 0) {
    return null;
  }

  if (operacao === "definir_valor_fixo") return valor.toFixed(2);

  const precoBase = Number(precoAtual);

  if (!Number.isFinite(precoBase)) return null;

  const novoPreco = (() => {
    if (operacao === "aumentar_percentual") {
      return precoBase * (1 + valor / 100);
    }

    if (operacao === "diminuir_percentual") {
      return precoBase * (1 - valor / 100);
    }

    return precoBase + valor;
  })();

  return Math.max(novoPreco, 0).toFixed(2);
}
