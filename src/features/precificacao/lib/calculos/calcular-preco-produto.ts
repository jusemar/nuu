import type {
  ConfiguracaoPagamentoCalculavel,
  EntradaPrecificacaoProduto,
  PrecoProdutoCalculado,
} from "../../types/precificacao.types";
import { formatarPrecoEmReais } from "../formatar-preco";
import { calcularParcelamentosCartao } from "./calcular-parcelamentos-cartao";

function aplicarPercentualBps(valorEmCentavos: number, percentualBps: number) {
  return Math.round(valorEmCentavos * (1 + percentualBps / 10000));
}

export function calcularPrecoProduto({
  entrada,
  configuracao,
}: {
  entrada: EntradaPrecificacaoProduto;
  configuracao: ConfiguracaoPagamentoCalculavel;
}): PrecoProdutoCalculado {
  const precoCartaoEmCentavos = aplicarPercentualBps(
    entrada.precoBaseEmCentavos,
    configuracao.percentualAcrescimoCartaoBps,
  );

  return {
    produtoId: entrada.produtoId,
    modalidade: entrada.modalidade,
    moeda: entrada.moeda || "BRL",
    pix: {
      ativo: configuracao.pixAtivo,
      valorEmCentavos: entrada.precoBaseEmCentavos,
      valor: formatarPrecoEmReais(entrada.precoBaseEmCentavos),
    },
    cartao: {
      ativo: configuracao.cartaoAtivo,
      valorEmCentavos: precoCartaoEmCentavos,
      valor: formatarPrecoEmReais(precoCartaoEmCentavos),
      parcelamentos: calcularParcelamentosCartao({
        valorEmCentavos: precoCartaoEmCentavos,
        configuracao,
      }),
    },
    boleto: {
      ativo: configuracao.boletoAtivo,
    },
    regrasAplicadas: [
      "configuracao_pagamento_ativa",
      "percentual_acrescimo_cartao",
      "parcelamento_cartao",
    ],
  };
}
