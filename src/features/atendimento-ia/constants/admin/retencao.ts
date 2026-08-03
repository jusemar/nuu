const DIAS_POR_MES_RETENCAO = 30;

export const RETENCAO_ADMIN = {
  auditorias: { permanente: true, dias: null },
  avaliacoes: { permanente: false, dias: 24 * DIAS_POR_MES_RETENCAO },
  dadosTecnicosTemporarios: { permanente: false, dias: 90 },
  laboratorio: { permanente: false, dias: 12 * DIAS_POR_MES_RETENCAO },
  propostas: { permanente: false, dias: 24 * DIAS_POR_MES_RETENCAO },
  restauracoes: { permanente: true, dias: null },
  versoesPublicadas: { permanente: true, dias: null },
} as const;

export const MESES_RETENCAO_AVALIACOES_PROPOSTAS = 24;
export const MESES_RETENCAO_LABORATORIO = 12;
export const DIAS_RETENCAO_DADOS_TECNICOS_TEMPORARIOS = 90;
