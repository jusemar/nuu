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
  promocaoCalculada?: PromocaoPrecificacaoProduto;
};

export type PromocaoPrecificacaoProduto = {
  ativa: boolean;
  precoOriginalEmCentavos: number;
  precoFinalEmCentavos: number;
  descontoAplicadoEmCentavos: number;
  regraAplicadaId: string | null;
  tipoDesconto: "percentual" | "valor_fixo" | null;
  valorDesconto: number;
  tipoCampanha?: "normal" | "relampago" | null;
  badgePromocional?: string | null;
  countdownPromocionalDataFim?: Date | null;
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
  precoOriginalEmCentavos: number;
  precoFinalEmCentavos: number;
  promocao: PromocaoPrecificacaoProduto;
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
