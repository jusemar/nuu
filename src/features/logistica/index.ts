export {
  consultarEntregaPropriaLoja,
  type EnderecoEntregaPropriaLoja,
  type ResultadoConsultaEntregaPropriaLoja,
} from "./actions/consultar-entrega-propria-loja";
export { garantirDadosIniciaisLogistica } from "./actions/seed/garantir-dados-iniciais-logistica";
export {
  adaptarProdutoAtualParaLogistica,
  adaptarVarianteAtualParaLogistica,
  type ProdutoAtualComDimensoes,
  type VarianteAtualComDimensoes,
} from "./lib/adaptadores/adaptar-produto-atual";
export {
  type ConfiguracaoCotacaoFreteInterna,
  cotarFreteInterno,
  type DependenciasCotacaoFreteInterna,
} from "./lib/cotacoes/cotar-frete-interno";
export { orquestrarCotacaoFrete } from "./lib/cotacoes/orquestrar-cotacao-frete";
export { filtrarResultadoCotacaoFreteDisponivel } from "./lib/disponibilidade/filtrar-resultado-cotacao-disponivel";
export {
  filtrarOpcoesFreteDisponiveis,
  resolverDisponibilidadeOpcaoFrete,
} from "./lib/disponibilidade/resolver-disponibilidade-frete";
export {
  type ConfiguracaoEntradaCotacaoFreteFluxoAtual,
  cotarFreteFluxoAtual,
  type EntradaCotacaoFreteFluxoAtual,
} from "./lib/entradas/cotar-frete-fluxo-atual";
export { agruparItensPorOrigemExpedicao } from "./lib/grupos-logisticos/agrupar-itens-por-origem-expedicao";
export { resolverOrigemExpedicaoProduto } from "./lib/grupos-logisticos/resolver-origem-expedicao-produto";
export {
  type ConsultaEntregaPropriaAtual,
  criarPortaEntregaPropriaAtual,
  type DependenciasPortaEntregaPropriaAtual,
  type PortaEntregaPropriaAtual,
  type ResultadoEntregaPropriaAtual,
} from "./lib/portas/criar-porta-entrega-propria-atual";
export {
  criarPortaRetiradaAtual,
  type DependenciasPortaRetiradaAtual,
  type PortaRetiradaAtual,
  type RetiradaAtualDisponivel,
} from "./lib/portas/criar-porta-retirada-atual";
export {
  type ConfiguracaoProvedorFreteEntregaPropria,
  criarProvedorFreteEntregaPropria,
  type DependenciasProvedorFreteEntregaPropria,
  type ProvedorFreteEntregaPropria,
} from "./lib/provedores/criar-provedor-frete-entrega-propria";
export {
  type ConfiguracaoProvedorFreteFrenet,
  criarProvedorFreteFrenet,
  type DependenciasProvedorFreteFrenet,
  type ProvedorFreteFrenet,
} from "./lib/provedores/criar-provedor-frete-frenet";
export {
  type ConfiguracaoProvedorFreteRetirada,
  criarProvedorFreteRetirada,
  type DependenciasProvedorFreteRetirada,
  type ProvedorFreteRetirada,
} from "./lib/provedores/criar-provedor-frete-retirada";
export {
  consultarCotacaoFrenet,
  ErroCotacaoFrenet,
  type FuncaoHttpFrenet,
  montarRequisicaoCotacaoFrenet,
  type ResultadoConsultaCotacaoFrenet,
} from "./lib/provedores/frenet/consultar-cotacao-frenet";
export { obterConfiguracaoFrenet } from "./lib/provedores/frenet/obter-configuracao-frenet";
export {
  type ResultadoValidacaoOpcoesFrete,
  validarOpcoesFrete,
} from "./lib/provedores/validar-opcoes-frete";
export {
  type CampoObrigatorioItemLogistico,
  type ErroResolucaoItemLogistico,
  type ProdutoParaItemLogistico,
  resolverItemLogistico,
  type ResultadoResolucaoItemLogistico,
  type VarianteParaItemLogistico,
} from "./lib/resolver-item-logistico";
export { mapearDisponibilidadeFreteProduto } from "./queries/disponibilidade/mapear-disponibilidade-frete-produto";
export {
  esquemaDimensoesPacote,
  esquemaEnderecoEntrega,
  esquemaErroCotacaoFrete,
  esquemaItemLogistico,
  esquemaOpcaoFrete,
  esquemaPacoteEnvio,
  esquemaProvedorFrete,
  esquemaResultadoCotacaoFrete,
  esquemaSelecaoFrete,
  esquemaSolicitacaoCotacaoFrete,
} from "./schemas/contratos-frete";
export {
  esquemaEfeitoRegraDisponibilidadeFrete,
  esquemaLimitesGlobaisFrete,
  esquemaProvedorDisponibilidadeFrete,
  esquemaRegraCategoriaDisponibilidadeFrete,
  esquemaRegraDisponibilidadeFrete,
  esquemaRegraProdutoDisponibilidadeFrete,
  esquemaRegraTipoLogisticoDisponibilidadeFrete,
  esquemaServicoDisponibilidadeFrete,
  esquemaTransportadoraDisponibilidadeFrete,
} from "./schemas/disponibilidade-frete";
export type {
  DimensoesPacote,
  EnderecoEntrega,
  ErroCotacaoFrete,
  ItemLogistico,
  OpcaoFrete,
  PacoteEnvio,
  ProvedorFrete,
  ResultadoCotacaoFrete,
  SelecaoFrete,
  SolicitacaoCotacaoFrete,
} from "./types/contratos-frete";
export type {
  ConfiguracaoDisponibilidadeFrete,
  ContextoProdutoDisponibilidadeFrete,
  DisponibilidadeFreteProduto,
  EfeitoRegraDisponibilidadeFrete,
  LimitesGlobaisFrete,
  MotivoIndisponibilidadeFrete,
  ProvedorDisponibilidadeFrete,
  RegraCategoriaDisponibilidadeFrete,
  RegraDisponibilidadeFrete,
  RegraProdutoDisponibilidadeFrete,
  RegraTipoLogisticoDisponibilidadeFrete,
  ResultadoDisponibilidadeOpcaoFrete,
  ServicoDisponibilidadeFrete,
  TransportadoraDisponibilidadeFrete,
  VolumeDisponibilidadeFrete,
  VolumesDisponibilidadeFrete,
} from "./types/disponibilidade-frete";
export type {
  ContextoOrigemExpedicao,
  GrupoLogistico,
  ItemAgrupavelLogisticamente,
  OrigemExpedicao,
} from "./types/grupos-logisticos";
