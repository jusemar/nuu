import { periodoAdminSchema } from "../../../schemas/admin/filtros.schema";
import type { IndicadorMetricaAdmin } from "../../../types/admin/metricas";

export const periodoMetricasControladoAdmin = periodoAdminSchema.parse({
  ate: "2026-08-03T23:59:59.000Z",
  desde: "2026-07-05T00:00:00.000Z",
});

export const metricasControladasAdmin = [
  { chave: "qualidade_media", total: 86, unidade: "percentual" },
  { chave: "duvidas_nao_respondidas", total: 18, unidade: "quantidade" },
  { chave: "avaliacoes_negativas", total: 7, unidade: "quantidade" },
  { chave: "transferencias", total: 26, unidade: "quantidade" },
  { chave: "recuperacao_rag", total: 91, unidade: "percentual" },
  { chave: "ferramentas", total: 84, unidade: "percentual" },
  { chave: "custo_estimado", total: 3842, unidade: "micros" },
  { chave: "tokens", total: 1284000, unidade: "tokens" },
  { chave: "latencia_mediana", total: 1800, unidade: "milissegundos" },
] satisfies IndicadorMetricaAdmin[];

export const assuntosRecorrentesControladosAdmin = [
  { assunto: "Prazo de entrega", quantidade: 124 },
  { assunto: "Disponibilidade de produto", quantidade: 98 },
  { assunto: "Acompanhamento de pedido", quantidade: 76 },
] as const;
