export type EnderecoAmostraFreteMerchant = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type AlvoMatrizFreteMerchant = {
  id: string;
  tipo: "faixa-regiao" | "bairro-avulso" | "cep-especifico";
  nome: string;
  amostras: EnderecoAmostraFreteMerchant[];
  motivoSemAmostra?: string;
};

export type ProdutoPadraoMatrizFreteMerchant = {
  merchantId: string;
  titulo: string;
  produtoId: string;
  varianteId: string | null;
  modalidadeComercial: string | null;
};

export type ResultadoCotacaoMatrizFreteMerchant = {
  entregavel: boolean;
  menorCustoEmCentavos: number | null;
  maiorPrazoEmDiasUteis: number | null;
  causa?: string;
};

export type ResultadoAlvoMatrizFreteMerchant = {
  id: string;
  tipo: AlvoMatrizFreteMerchant["tipo"];
  nome: string;
  cepsAmostrados: string[];
  quantidadeProdutosAnalisados: number;
  quantidadeEntregavel: number;
  quantidadeNaoEntregavel: number;
  maiorCustoMinimoEmCentavos: number | null;
  maiorPrazoEmDiasUteis: number | null;
  coberturaPadraoSeguraNaAmostra: boolean;
  impedimentos: Array<{
    merchantId: string;
    titulo: string;
    cep: string | null;
    causa: string;
  }>;
};

export type RelatorioMatrizFreteMerchant = {
  geradoEm: string;
  criterio: string;
  limites: {
    maximoProdutos: number;
    maximoAlvos: number;
    concorrencia: number;
    intervaloEntreCotacoesMs: number;
  };
  catalogo: {
    quantidadeItensPadraoEncontrados: number;
    quantidadeItensAnalisados: number;
    produtosTruncados: boolean;
  };
  regioes: {
    quantidadeAlvosEncontrados: number;
    quantidadeAlvosAnalisados: number;
    alvosTruncados: boolean;
  };
  resultados: ResultadoAlvoMatrizFreteMerchant[];
  limitacoes: string[];
};
