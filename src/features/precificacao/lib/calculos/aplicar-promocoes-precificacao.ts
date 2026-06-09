import { calcularPromocoes } from "../../../promocoes/services";
import type { ItemPromocaoCalculado } from "../../../promocoes/types";

import type {
  EntradaPrecificacaoProduto,
  PromocaoPrecificacaoProduto,
} from "../../types/precificacao.types";

type PromocaoPorEntrada = {
  entrada: EntradaPrecificacaoProduto;
  promocao: PromocaoPrecificacaoProduto;
};

function mapearPromocaoPrecificacao(
  item: ItemPromocaoCalculado,
): PromocaoPrecificacaoProduto {
  return {
    ativa: item.desconto_aplicado > 0,
    precoOriginalEmCentavos: item.preco_original,
    precoFinalEmCentavos: item.preco_final,
    descontoAplicadoEmCentavos: item.desconto_aplicado,
    regraAplicadaId: item.regra_aplicada,
    tipoDesconto: item.tipo_desconto,
    valorDesconto: item.valor_desconto,
    tipoCampanha: item.tipoCampanha,
    badgePromocional: item.badgePromocional,
    countdownPromocionalDataFim: item.countdownPromocionalDataFim,
  };
}

export async function aplicarPromocoesPrecificacao(
  entradas: EntradaPrecificacaoProduto[],
): Promise<PromocaoPorEntrada[]> {
  if (entradas.length === 0) {
    return [];
  }

  const resultadoPromocoes = await calcularPromocoes({
    itens: entradas.map((entrada) => ({
      produtoId: entrada.produtoId,
      modalidade: entrada.modalidade,
      quantidade: 1,
      precoBaseEmCentavos: entrada.precoBaseEmCentavos,
    })),
  });

  return entradas.map((entrada, indice) => ({
    entrada,
    promocao: mapearPromocaoPrecificacao(resultadoPromocoes.itens[indice]!),
  }));
}
