export type ConfiguracaoPagamentoCalculavel = {
  pixAtivo: boolean;
  cartaoAtivo: boolean;
  boletoAtivo: boolean;
  percentualAcrescimoCartaoBps: number;
  parcelasSemJuros: number;
  taxaJurosMensalBps: number;
  maximoParcelas: number;
  valorMinimoParcelaEmCentavos: number;
};

export type EntradaPrecificacaoProduto = {
  produtoId: string;
  modalidade: string;
  precoBaseEmCentavos: number;
  moeda?: "BRL";
};

export type ParcelamentoCartaoCalculado = {
  parcelas: number;
  valorParcelaEmCentavos: number;
  totalEmCentavos: number;
  valor: string;
  total: string;
  semJuros: boolean;
};

export type PrecoProdutoCalculado = {
  produtoId: string;
  modalidade: string;
  moeda: "BRL";
  pix: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
  };
  cartao: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
    parcelamentos: ParcelamentoCartaoCalculado[];
  };
  boleto: {
    ativo: boolean;
  };
  regrasAplicadas: string[];
};

export type PrecosProdutoPorModalidade = Record<string, PrecoProdutoCalculado>;
