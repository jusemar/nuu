/** Valores estáveis compartilhados pelos contratos administrativos. */
export const TIPOS_CONHECIMENTO_ADMIN = [
  "institucional",
  "pergunta_resposta",
  "comportamento_tom",
] as const;

export const ESTADOS_EDITORIAIS_ADMIN = [
  "rascunho",
  "em_revisao",
  "publicado",
  "desativado",
] as const;

export const ESTADOS_REVISAO_ADMIN = [
  "pendente",
  "em_analise",
  "aprovada",
  "reprovada",
  "cancelada",
  "substituida",
] as const;

export const ESTADOS_PROPOSTA_MELHORIA_ADMIN = [
  "aberta",
  "em_triagem",
  "aceita",
  "em_implementacao",
  "aguardando_testes",
  "concluida",
  "rejeitada",
  "cancelada",
] as const;

export const CATEGORIAS_PROPOSTA_MELHORIA_ADMIN = [
  "conhecimento",
  "pergunta_resposta",
  "comportamento",
  "ferramenta",
  "integracao",
  "experiencia_usuario",
  "transferencia_humana",
  "seguranca",
  "observabilidade",
] as const;

export const ESTADOS_CASO_TESTE_ADMIN = [
  "rascunho",
  "em_revisao",
  "aprovado",
  "desativado",
] as const;

export const CRITICIDADES_ADMIN = [
  "baixa",
  "media",
  "alta",
  "critica",
] as const;

export const ESTADOS_EXECUCAO_LABORATORIO_ADMIN = [
  "pendente",
  "processando",
  "concluida",
  "falhou",
  "cancelada",
  "bloqueada",
] as const;

export const RESULTADOS_ADMIN = [
  "aprovado",
  "precisa_melhorar",
  "reprovado",
  "inconclusivo",
  "bloqueado",
] as const;

export const MODOS_TESTE_ADMIN = ["individual", "combinado"] as const;

export const FORMAS_EXECUCAO_LABORATORIO_ADMIN = [
  "sincrona",
  "assincrona",
] as const;

export const PORTES_EXECUCAO_LABORATORIO_ADMIN = [
  "individual",
  "pequeno",
  "conjunto_maior",
  "regressao",
] as const;
