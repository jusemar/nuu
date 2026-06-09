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

function obterPromocaoPrecificacao(entrada: EntradaPrecificacaoProduto) {
  return (
    entrada.promocaoCalculada ?? {
      ativa: false,
      precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
      precoFinalEmCentavos: entrada.precoBaseEmCentavos,
      descontoAplicadoEmCentavos: 0,
      regraAplicadaId: null,
      tipoDesconto: null,
      valorDesconto: 0,
    }
  );
}

export function calcularPrecoProduto({
  entrada,
  configuracao,
}: {
  entrada: EntradaPrecificacaoProduto;
  configuracao: ConfiguracaoPagamentoCalculavel;
}): PrecoProdutoCalculado {
  const promocao = obterPromocaoPrecificacao(entrada);
  const precoFinalEmCentavos = promocao.precoFinalEmCentavos;
  const precoCartaoEmCentavos = aplicarPercentualBps(
    precoFinalEmCentavos,
    configuracao.percentualAcrescimoCartaoBps,
  );

  return {
    produtoId: entrada.produtoId,
    modalidade: entrada.modalidade,
    moeda: entrada.moeda || "BRL",
    precoOriginalEmCentavos: promocao.precoOriginalEmCentavos,
    precoFinalEmCentavos,
    promocao,
    pix: {
      ativo: configuracao.pixAtivo,
      valorEmCentavos: precoFinalEmCentavos,
      valor: formatarPrecoEmReais(precoFinalEmCentavos),
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
      ...(promocao.ativa ? ["promotion_engine"] : []),
      "configuracao_pagamento_ativa",
      "percentual_acrescimo_cartao",
      "parcelamento_cartao",
    ],
  };
}
