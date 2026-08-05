/**
 * Barrel da feature Pagamento na Entrega.
 *
 * Exporta o motor puro (Bloco 2) e a configuração administrativa por serviço (Bloco 3).
 *
 * A action e a query do admin NÃO são reexportadas aqui de propósito: ambas são
 * `server-only` e, puxadas por este barrel, contaminariam qualquer componente client que
 * importasse um tipo daqui. Quem precisa delas importa o caminho direto.
 */

export {
  MENSAGEM_MOTIVO_PAGAMENTO_NA_ENTREGA,
  MENSAGEM_SELO_PDP_PAGAMENTO_NA_ENTREGA,
  MODALIDADES_COMERCIAIS_SUPORTADAS_PADRAO,
  ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA,
  PROVEDOR_ENTREGA_PROPRIA,
  ROTULO_FORMA_PAGAMENTO_NA_ENTREGA,
} from "./constants/pagamento-na-entrega.constants";
export { avaliarConsistenciaTrocoPedido } from "./lib/avaliar-consistencia-troco-pedido";
export { avaliarElegibilidadePagamentoNaEntrega } from "./lib/avaliar-elegibilidade-pagamento-na-entrega";
export { resolverFlagPagamentoNaEntregaItem } from "./lib/resolver-flag-pagamento-na-entrega-item";
export {
  type DadosSalvarConfiguracaoPagamentoNaEntregaServico,
  extrairDadosFormularioConfiguracao,
  salvarConfiguracaoPagamentoNaEntregaServicoSchema,
} from "./schemas/configuracao-pagamento-na-entrega-servico.schema";
export type {
  CodigoMotivoPagamentoNaEntrega,
  CodigoProblemaTrocoPedido,
  ConfiguracaoPagamentoNaEntregaServico,
  ContextoAvaliacaoPagamentoNaEntrega,
  EntradaAvaliacaoPagamentoNaEntrega,
  EntradaConsistenciaTrocoPedido,
  EscopoMotivoPagamentoNaEntrega,
  FormaPagamentoNaEntrega,
  FreteEscolhidoItemPagamentoNaEntrega,
  ItemAvaliacaoPagamentoNaEntrega,
  LimitesPagamentoNaEntrega,
  ModalidadeComercialCanonica,
  MotivoPagamentoNaEntrega,
  ProblemaTrocoPedido,
  RegrasAplicadasPagamentoNaEntrega,
  ResultadoAvaliacaoPagamentoNaEntrega,
  ResultadoConsistenciaTrocoPedido,
  ServicoAvaliadoPagamentoNaEntrega,
} from "./types/pagamento-na-entrega.types";
