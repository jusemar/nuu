import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { distribuicao } from "./auxiliares-metricas";

export async function buscarFalhasFerramentas(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [usos, falhas] = await Promise.all([
    db.execute(
      sql`select nome_ferramenta nome, count(*) total from atendimento_ia_execucoes_ferramentas where iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} group by nome_ferramenta order by count(*) desc, nome_ferramenta limit 50`,
    ),
    db.execute(
      sql`select nome_ferramenta nome, count(*) total from atendimento_ia_execucoes_ferramentas where iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and status='falhou' group by nome_ferramenta order by count(*) desc, nome_ferramenta limit 50`,
    ),
  ]);
  return {
    distribuicoes: [
      distribuicao(
        "ferramentas_utilizadas",
        "atendimento_ia_execucoes_ferramentas.nome_ferramenta",
        usos.rows as never,
      ),
      distribuicao(
        "falhas_por_ferramenta",
        "atendimento_ia_execucoes_ferramentas.status",
        falhas.rows as never,
      ),
    ],
  };
}
