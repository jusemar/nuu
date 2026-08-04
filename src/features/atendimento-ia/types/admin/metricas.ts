export type StatusDisponibilidadeMetrica = "real" | "parcial" | "indisponivel";

export type PeriodoMetricasAdmin = {
  ate: Date;
  desde: Date;
  rotulo: string;
  timezone: "America/Sao_Paulo";
};

export type FiltroMetricasAdmin = {
  periodo: PeriodoMetricasAdmin;
};

/** Contrato legado dos dados controlados dos Blocos 1–2; não é usado nas consultas reais. */
export type IndicadorMetricaAdmin = {
  chave: string;
  total: number;
  unidade: "quantidade" | "percentual" | "milissegundos" | "tokens" | "micros";
};

export type MetricaAdministrativa = {
  chave: string;
  fonte: string;
  quantidadeRegistros: number;
  status: StatusDisponibilidadeMetrica;
  unidade: "quantidade" | "percentual" | "milissegundos" | "tokens" | "micros";
  valor: number | null;
};

export type DistribuicaoMetrica = {
  chave: string;
  fonte: string;
  itens: Array<{ nome: string; total: number }>;
  quantidadeRegistros: number;
  status: StatusDisponibilidadeMetrica;
};

export type SerieTemporalMetrica = {
  chave: string;
  fonte: string;
  pontos: Array<{ periodo: string; total: number }>;
  quantidadeRegistros: number;
  status: StatusDisponibilidadeMetrica;
};

export type AlertaOperacionalAdmin = {
  codigo: string;
  descricao: string;
  fonte: string;
  severidade: "informativo" | "atencao" | "critico";
};

export type SaudeDadosAdmin = {
  alertas: AlertaOperacionalAdmin[];
  atualizadoEm: Date;
  status: "saudavel" | "atencao" | "critico";
};

export type ClasseRetencaoAdmin =
  | "permanente"
  | "vinte_quatro_meses"
  | "doze_meses"
  | "noventa_dias";

export type ItemDryRunRetencao = {
  fonte: string;
  classe: ClasseRetencaoAdmin;
  elegiveis: number;
  protegidos: number;
  vencemEm30Dias: number;
};

export type ResultadoDryRunRetencao = {
  executadoEm: Date;
  itens: ItemDryRunRetencao[];
  modo: "dry_run";
  registrosExcluidos: 0;
};

export type PainelMetricasAdmin = {
  atendimento: {
    distribuicoes: DistribuicaoMetrica[];
    indicadores: MetricaAdministrativa[];
  };
  laboratorio: {
    distribuicoes: DistribuicaoMetrica[];
    indicadores: MetricaAdministrativa[];
  };
  periodo: PeriodoMetricasAdmin;
  publicacoes: {
    distribuicoes: DistribuicaoMetrica[];
    indicadores: MetricaAdministrativa[];
  };
  retencao: ResultadoDryRunRetencao;
  saude: SaudeDadosAdmin;
  series: SerieTemporalMetrica[];
  treinamento: {
    distribuicoes: DistribuicaoMetrica[];
    indicadores: MetricaAdministrativa[];
  };
  atualizadoEm: Date;
};
