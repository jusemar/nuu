// Barrel exclusivo do painel. A superfície pública do domínio permanece em
// `index.ts` e não carrega componentes ou contratos administrativos.
export { PaginaConhecimentos } from "./components/admin/conhecimentos/pagina-conhecimentos";
export { PaginaInicioTreinamento } from "./components/admin/inicio/pagina-inicio-treinamento";
export { PaginaMetricas } from "./components/admin/metricas/pagina-metricas";
export { PaginaRevisoes } from "./components/admin/revisoes/pagina-revisoes";
export { PaginaTestes } from "./components/admin/testes/pagina-testes";
export type { IdRotaTreinamentoAdmin } from "./constants/admin/rotas-treinamento";
export {
  ROTAS_TREINAMENTO_ADMIN,
  ROTAS_TREINAMENTO_ADMIN_POR_ID,
} from "./constants/admin/rotas-treinamento";
