export const CONFIGURACAO_PAGAMENTO_PADRAO = {
  nome: "Configuração padrão",
  pixAtivo: true,
  cartaoAtivo: true,
  boletoAtivo: false,
  percentualAcrescimoCartaoBps: 1500,
  parcelasSemJuros: 3,
  taxaJurosMensalBps: 199,
  maximoParcelas: 10,
  valorMinimoParcelaEmCentavos: 500,
} as const;
