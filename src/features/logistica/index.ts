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
  consultarEntregaPropriaLoja,
  type EnderecoEntregaPropriaLoja,
  type ResultadoConsultaEntregaPropriaLoja,
} from "./actions/consultar-entrega-propria-loja";
export { garantirDadosIniciaisLogistica } from "./actions/seed/garantir-dados-iniciais-logistica";

export {
  resolverItemLogistico,
  type CampoObrigatorioItemLogistico,
  type ErroResolucaoItemLogistico,
  type ProdutoParaItemLogistico,
  type ResultadoResolucaoItemLogistico,
  type VarianteParaItemLogistico,
} from "./lib/resolver-item-logistico";

export {
  adaptarProdutoAtualParaLogistica,
  adaptarVarianteAtualParaLogistica,
  type ProdutoAtualComDimensoes,
  type VarianteAtualComDimensoes,
} from "./lib/adaptadores/adaptar-produto-atual";

export {
  criarProvedorFreteEntregaPropria,
  type ConfiguracaoProvedorFreteEntregaPropria,
  type DependenciasProvedorFreteEntregaPropria,
  type ProvedorFreteEntregaPropria,
} from "./lib/provedores/criar-provedor-frete-entrega-propria";

export {
  criarProvedorFreteRetirada,
  type ConfiguracaoProvedorFreteRetirada,
  type DependenciasProvedorFreteRetirada,
  type ProvedorFreteRetirada,
} from "./lib/provedores/criar-provedor-frete-retirada";

export {
  criarProvedorFreteFrenet,
  type ConfiguracaoProvedorFreteFrenet,
  type DependenciasProvedorFreteFrenet,
  type ProvedorFreteFrenet,
} from "./lib/provedores/criar-provedor-frete-frenet";

export { obterConfiguracaoFrenet } from "./lib/provedores/frenet/obter-configuracao-frenet";
export {
  consultarCotacaoFrenet,
  montarRequisicaoCotacaoFrenet,
  ErroCotacaoFrenet,
  type FuncaoHttpFrenet,
  type ResultadoConsultaCotacaoFrenet,
} from "./lib/provedores/frenet/consultar-cotacao-frenet";

export {
  cotarFreteInterno,
  type ConfiguracaoCotacaoFreteInterna,
  type DependenciasCotacaoFreteInterna,
} from "./lib/cotacoes/cotar-frete-interno";

export {
  cotarFreteFluxoAtual,
  type ConfiguracaoEntradaCotacaoFreteFluxoAtual,
  type EntradaCotacaoFreteFluxoAtual,
} from "./lib/entradas/cotar-frete-fluxo-atual";

export { orquestrarCotacaoFrete } from "./lib/cotacoes/orquestrar-cotacao-frete";

export {
  validarOpcoesFrete,
  type ResultadoValidacaoOpcoesFrete,
} from "./lib/provedores/validar-opcoes-frete";

export {
  filtrarOpcoesFreteDisponiveis,
  resolverDisponibilidadeOpcaoFrete,
} from "./lib/disponibilidade/resolver-disponibilidade-frete";
export { filtrarResultadoCotacaoFreteDisponivel } from "./lib/disponibilidade/filtrar-resultado-cotacao-disponivel";
export { mapearDisponibilidadeFreteProduto } from "./queries/disponibilidade/mapear-disponibilidade-frete-produto";

export {
  criarPortaEntregaPropriaAtual,
  type ConsultaEntregaPropriaAtual,
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
