import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type {
  PeriodoMetricasAdmin,
  SerieTemporalMetrica,
} from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { numero } from "./auxiliares-metricas";

export async function buscarSeriesTemporais(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const linhas = await db.execute(sql`
    select to_char(date_trunc('day', iniciado_em at time zone 'America/Sao_Paulo'),'YYYY-MM-DD') periodo,
      count(*) total, count(*) filter(where status in ('falhou','limite_excedido')) falhas
    from atendimento_ia_execucoes
    where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}
    group by 1 order by 1 asc limit 367`);
  const serie = (
    chave: string,
    campo: "total" | "falhas",
  ): SerieTemporalMetrica => ({
    chave,
    fonte: "atendimento_ia_execucoes",
    quantidadeRegistros: linhas.rows.reduce(
      (s, item) => s + numero(item[campo]),
      0,
    ),
    status: "real",
    pontos: linhas.rows.map((item) => ({
      periodo: String(item.periodo),
      total: numero(item[campo]),
    })),
  });
  return [
    serie("execucoes_por_dia", "total"),
    serie("falhas_por_dia", "falhas"),
  ];
}
