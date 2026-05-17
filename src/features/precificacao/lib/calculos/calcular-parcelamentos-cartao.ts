import type {
  ConfiguracaoPagamentoCalculavel,
  ParcelamentoCartaoCalculado,
} from "../../types/precificacao.types";
import { formatarPrecoEmReais } from "../formatar-preco";

function calcularTotalComJuros({
  valorEmCentavos,
  parcelas,
  configuracao,
}: {
  valorEmCentavos: number;
  parcelas: number;
  configuracao: ConfiguracaoPagamentoCalculavel;
}) {
  if (parcelas <= configuracao.parcelasSemJuros) {
    return valorEmCentavos;
  }

  return Math.round(
    valorEmCentavos *
      (1 + (configuracao.taxaJurosMensalBps / 10000) * parcelas),
  );
}

export function calcularParcelamentosCartao({
  valorEmCentavos,
  configuracao,
}: {
  valorEmCentavos: number;
  configuracao: ConfiguracaoPagamentoCalculavel;
}): ParcelamentoCartaoCalculado[] {
  return Array.from({ length: configuracao.maximoParcelas }, (_, index) => {
    const parcelas = index + 1;
    const totalEmCentavos = calcularTotalComJuros({
      valorEmCentavos,
      parcelas,
      configuracao,
    });
    const valorParcelaEmCentavos = Math.ceil(totalEmCentavos / parcelas);

    return {
      parcelas,
      valorParcelaEmCentavos,
      totalEmCentavos,
      valor: formatarPrecoEmReais(valorParcelaEmCentavos),
      total: formatarPrecoEmReais(totalEmCentavos),
      semJuros: parcelas <= configuracao.parcelasSemJuros,
    };
  }).filter(
    (parcelamento) =>
      parcelamento.valorParcelaEmCentavos >=
      configuracao.valorMinimoParcelaEmCentavos,
  );
}
