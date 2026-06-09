export {
  alternarStatusPromocaoAdmin,
  buscarProdutosPromocaoAdmin as buscarProdutosPromocaoAdminAction,
  duplicarPromocaoAdmin,
  salvarPromocaoAdmin,
} from "./actions";
export { adaptarPromocoesLegadasParaEngine } from "./adaptadores";
export {
  BadgePromocional,
  type TipoBadgePromocionalVisual,
} from "./components/store/badge-promocional";
export {
  calcularPromocoes,
  registrarUsoCupomPromocao,
  validarCupomPromocao,
} from "./services";
export { buscarPromocoesValidas } from "./queries";
export type {
  ContextoCalculoPromocao,
  EntradaCalculoPromocoes,
  ItemEntradaPromocao,
  ItemPromocaoCalculado,
  PromocaoAplicada,
  RegraPromocaoCalculavel,
  ResultadoCalculoPromocoes,
  StatusPromocao,
  TipoDescontoPromocao,
  VinculoProdutoPromocaoCalculavel,
} from "./types";
export type {
  CampanhaPromocionalLegadaAdaptada,
  CountdownPromocionalLegadoAdaptado,
  OpcoesAdaptacaoPromocoesLegadas,
  PromocaoLegadaEntrada,
  ResultadoAdaptacaoPromocoesLegadas,
  TipoBadgePromocionalLegado,
  TipoCampanhaPromocionalLegada,
  TipoPromocaoLegada,
} from "./types";
