export type PeriodoMetricasAdmin = { ate: Date; desde: Date };

export type FiltroMetricasAdmin = {
  categoria?:
    | "qualidade"
    | "rag"
    | "ferramentas"
    | "transferencias"
    | "seguranca"
    | "custos_latencia";
  periodo: PeriodoMetricasAdmin;
  versaoPublicadaId?: string;
};

export type IndicadorMetricaAdmin = {
  chave: string;
  total: number;
  unidade: "quantidade" | "percentual" | "milissegundos" | "tokens" | "micros";
};
