import type { TipoDescontoPromocao } from "../types/promocoes.types";

type EntradaDescontoProduto = {
  precoBaseEmCentavos: number;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
};

export function calcularDescontoProduto({
  precoBaseEmCentavos,
  tipoDesconto,
  valorDesconto,
}: EntradaDescontoProduto): number {
  if (precoBaseEmCentavos <= 0 || valorDesconto <= 0) {
    return 0;
  }

  if (tipoDesconto === "percentual") {
    const desconto = Math.floor((precoBaseEmCentavos * valorDesconto) / 100);
    return Math.min(desconto, precoBaseEmCentavos);
  }

  return Math.min(valorDesconto, precoBaseEmCentavos);
}
