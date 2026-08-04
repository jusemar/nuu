import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { distribuicao, metrica, numero } from "./auxiliares-metricas";

export async function buscarDistribuicaoAvaliacoes(
  periodo: PeriodoMetricasAdmin,
) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [resumo, notas, resultados, problemas] = await Promise.all([
    db.execute(
      sql`select count(*) total, count(nota) com_nota, avg(nota) media from atendimento_ia_avaliacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and status='registrada'`,
    ),
    db.execute(
      sql`select nota::text nome, count(*) total from atendimento_ia_avaliacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and status='registrada' and nota is not null group by nota order by nota`,
    ),
    db.execute(
      sql`select resultado::text nome, count(*) total from atendimento_ia_avaliacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and status='registrada' and resultado is not null group by resultado order by resultado`,
    ),
    db.execute(
      sql`select classificacao_problema::text nome, count(*) total from atendimento_ia_avaliacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and status='registrada' and classificacao_problema is not null group by classificacao_problema order by classificacao_problema limit 50`,
    ),
  ]);
  const linha = resumo.rows[0] ?? {};
  return {
    distribuicoes: [
      distribuicao(
        "notas",
        "atendimento_ia_avaliacoes.nota",
        notas.rows as never,
      ),
      distribuicao(
        "resultados_avaliacoes",
        "atendimento_ia_avaliacoes.resultado",
        resultados.rows as never,
      ),
      distribuicao(
        "problemas_avaliacoes",
        "atendimento_ia_avaliacoes.classificacao_problema",
        problemas.rows as never,
      ),
    ],
    indicadores: [
      metrica(
        "avaliacoes_total",
        linha.total,
        linha.total,
        "atendimento_ia_avaliacoes",
      ),
      metrica(
        "nota_media",
        linha.media,
        linha.com_nota,
        "atendimento_ia_avaliacoes.nota",
      ),
    ],
    total: numero(linha.total),
  };
}
