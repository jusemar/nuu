export const PAPEIS_ATENDIMENTO_IA_ADMIN = [
  "gestor_principal",
  "revisor",
  "visualizador",
] as const;

export const CAPACIDADES_ATENDIMENTO_IA_ADMIN = [
  "modulo_visualizar",
  "metricas_leitura",
  "conhecimentos_leitura",
  "conversas_sanitizadas_leitura",
  "rascunhos_escrita",
  "avaliacoes_escrita",
  "propostas_escrita",
  "revisoes_decisao",
  "testes_execucao",
  "publicacoes_escrita",
  "restauracoes_escrita",
  "papeis_gestao",
  "acoes_criticas_execucao",
] as const;

/** Capacidades-base; a leitura de conversas do visualizador exige concessão adicional. */
export const CAPACIDADES_BASE_POR_PAPEL_ADMIN = {
  gestor_principal: CAPACIDADES_ATENDIMENTO_IA_ADMIN,
  revisor: [
    "modulo_visualizar",
    "metricas_leitura",
    "conhecimentos_leitura",
    "conversas_sanitizadas_leitura",
    "rascunhos_escrita",
    "avaliacoes_escrita",
    "propostas_escrita",
    "revisoes_decisao",
    "testes_execucao",
  ],
  visualizador: [
    "modulo_visualizar",
    "metricas_leitura",
    "conhecimentos_leitura",
  ],
} as const satisfies Record<
  (typeof PAPEIS_ATENDIMENTO_IA_ADMIN)[number],
  readonly (typeof CAPACIDADES_ATENDIMENTO_IA_ADMIN)[number][]
>;
