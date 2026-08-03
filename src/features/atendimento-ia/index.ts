export { CampoMensagemAtendente } from "./components/store/campo-mensagem-atendente";
export { CartaoTransferenciaWhatsapp } from "./components/store/cartao-transferencia-whatsapp";
export { PaginaAtendimento } from "./components/store/pagina-atendimento";

// Contratos administrativos seguros. O barrel não expõe instruções internas,
// repositórios, credenciais ou detalhes de execução do Atendente IA.
export {
  BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN,
  DADOS_DINAMICOS_NUNCA_INSTITUCIONAIS_ADMIN,
} from "./constants/admin/bloqueios-publicacao";
export {
  CAPACIDADES_ATENDIMENTO_IA_ADMIN,
  CAPACIDADES_BASE_POR_PAPEL_ADMIN,
  PAPEIS_ATENDIMENTO_IA_ADMIN,
} from "./constants/admin/capacidades";
export {
  CRITICIDADES_ADMIN,
  ESTADOS_CASO_TESTE_ADMIN,
  ESTADOS_EDITORIAIS_ADMIN,
  ESTADOS_EXECUCAO_LABORATORIO_ADMIN,
  ESTADOS_PROPOSTA_MELHORIA_ADMIN,
  ESTADOS_REVISAO_ADMIN,
  FORMAS_EXECUCAO_LABORATORIO_ADMIN,
  MODOS_TESTE_ADMIN,
  PORTES_EXECUCAO_LABORATORIO_ADMIN,
  TIPOS_CONHECIMENTO_ADMIN,
} from "./constants/admin/estados";
export { RETENCAO_ADMIN } from "./constants/admin/retencao";
export {
  CLASSIFICACOES_PROBLEMA_ADMIN,
  CRITERIOS_AVALIACAO_ADMIN,
  DECISOES_AVALIACAO_ADMIN,
  NOTAS_AVALIACAO_ADMIN,
} from "./constants/admin/rubricas";
export { avaliacaoRespostaAdminSchema } from "./schemas/admin/avaliacao.schema";
export { casoTesteAdminSchema } from "./schemas/admin/caso-teste.schema";
export { comportamentoTomAdminSchema } from "./schemas/admin/comportamento.schema";
export { conhecimentoAdminSchema } from "./schemas/admin/conhecimento.schema";
export {
  filtrosAdminSchema,
  paginacaoAdminSchema,
  periodoAdminSchema,
} from "./schemas/admin/filtros.schema";
export { execucaoLaboratorioAdminSchema } from "./schemas/admin/laboratorio.schema";
export {
  criarConteudoCanonicoPerguntaRespostaAdmin,
  perguntaRespostaAdminSchema,
} from "./schemas/admin/pergunta-resposta.schema";
export { propostaMelhoriaAdminSchema } from "./schemas/admin/proposta-melhoria.schema";
export type { ComportamentoTomAdmin } from "./types/admin/comportamento";
export type {
  ConhecimentoAdmin,
  EstadoEditorialAdmin,
  PerguntaRespostaAdmin,
  TipoConhecimentoAdmin,
} from "./types/admin/conhecimento";
export type {
  FiltroMetricasAdmin,
  IndicadorMetricaAdmin,
} from "./types/admin/metricas";
export type {
  AcessoAtendimentoIaAdmin,
  CapacidadeAtendimentoIaAdmin,
  PapelAtendimentoIaAdmin,
} from "./types/admin/permissoes";
export type {
  AvaliacaoRespostaAdmin,
  PropostaMelhoriaAdmin,
} from "./types/admin/revisao";
export type {
  BloqueioCriticoPublicacaoAdmin,
  CandidatoLaboratorioAdmin,
  CasoTesteAdmin,
} from "./types/admin/testes";
