import type {
  ItemLogistico,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "./contratos-frete";
import type { ContextoOrigemExpedicao } from "./grupos-logisticos";

/**
 * Mantém as opções e eventuais erros dentro do grupo que os produziu.
 * Esse contrato ainda não participa da seleção nem do total oficial do checkout.
 */
export type CotacaoGrupoLogistico = ContextoOrigemExpedicao & {
  chaveGrupo: string;
  cepOrigem: string;
  itens: ItemLogistico[];
  solicitacao: SolicitacaoCotacaoFrete;
  resultado: ResultadoCotacaoFrete;
};

export type ResultadoCotacoesGruposLogisticos = {
  identificadorCotacaoOriginal: string;
  cotacoes: CotacaoGrupoLogistico[];
};
