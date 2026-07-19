import {
  MODALIDADES_PRECO_PRODUTO,
  obterRotuloModalidadePreco,
} from "../../constants/modalidades-preco";
import type { PrecoModalidadeProduto } from "../../types/alteracao-em-massa.types";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export type PrecoProdutoExibicao = {
  id: string;
  modalidade: PrecoModalidadeProduto["modalidade"];
  rotulo: string;
  valorFormatado: string;
  prazoFormatado: string;
};

/** Mantém apenas preços reais e segue a ordem central das modalidades. */
export function resumirPrecosProduto(
  precos: PrecoModalidadeProduto[],
): PrecoProdutoExibicao[] {
  const ordem = new Map(
    MODALIDADES_PRECO_PRODUTO.map((modalidade, indice) => [
      modalidade.id,
      indice,
    ]),
  );

  return precos
    .filter(
      (preco) =>
        Number.isSafeInteger(preco.precoEmCentavos) &&
        preco.precoEmCentavos >= 0,
    )
    .map((preco) => ({
      id: preco.id,
      modalidade: preco.modalidade,
      rotulo: obterRotuloModalidadePreco(preco.modalidade),
      valorFormatado: formatadorMoeda.format(preco.precoEmCentavos / 100),
      prazoFormatado: preco.prazo?.trim() || "Prazo não informado",
    }))
    .toSorted(
      (a, b) =>
        (ordem.get(a.modalidade) ?? Number.MAX_SAFE_INTEGER) -
        (ordem.get(b.modalidade) ?? Number.MAX_SAFE_INTEGER),
    );
}
