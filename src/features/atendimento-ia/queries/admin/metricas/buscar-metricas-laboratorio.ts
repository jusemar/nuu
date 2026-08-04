import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { distribuicao, metrica, numero } from "./auxiliares-metricas";

export async function buscarMetricasLaboratorio(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [resumo, status, modos, tipos, resultados, ferramentas, violacoes] =
    await Promise.all([
      db.execute(
        sql`select count(*) total, coalesce(sum(tokens_entrada),0) entrada, coalesce(sum(tokens_saida),0) saida, coalesce(sum(custo_estimado),0) custo, avg(extract(epoch from (concluido_em-iniciado_em))*1000) duracao, count(concluido_em) duracoes from atendimento_ia_execucoes_laboratorio where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate}`,
      ),
      db.execute(
        sql`select status::text nome, count(*) total from atendimento_ia_execucoes_laboratorio where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by status order by status`,
      ),
      db.execute(
        sql`select modo_execucao::text nome, count(*) total from atendimento_ia_execucoes_laboratorio where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by modo_execucao order by modo_execucao`,
      ),
      db.execute(
        sql`select tipo_comparacao::text nome, count(*) total from atendimento_ia_execucoes_laboratorio where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by tipo_comparacao order by tipo_comparacao`,
      ),
      db.execute(
        sql`select coalesce(decisao_humana,resultado_automatico)::text nome, count(*) total from atendimento_ia_resultados_laboratorio where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by coalesce(decisao_humana,resultado_automatico) order by nome`,
      ),
      db.execute(
        sql`select ferramenta nome, count(*) total from atendimento_ia_resultados_laboratorio r cross join lateral jsonb_array_elements_text(r.ferramentas_simuladas) ferramenta where r.criado_em >= ${periodo.desde} and r.criado_em < ${periodo.ate} group by ferramenta order by count(*) desc, ferramenta limit 50`,
      ),
      db.execute(
        sql`select violacao nome, count(*) total from atendimento_ia_resultados_laboratorio r cross join lateral jsonb_array_elements_text(r.violacoes) violacao where r.criado_em >= ${periodo.desde} and r.criado_em < ${periodo.ate} group by violacao order by count(*) desc, violacao limit 50`,
      ),
    ]);
  const linha = resumo.rows[0] ?? {};
  const total = numero(linha.total);
  return {
    distribuicoes: [
      distribuicao(
        "laboratorio_status",
        "atendimento_ia_execucoes_laboratorio.status",
        status.rows as never,
      ),
      distribuicao(
        "laboratorio_modos",
        "atendimento_ia_execucoes_laboratorio.modo_execucao",
        modos.rows as never,
      ),
      distribuicao(
        "candidatos_testados",
        "atendimento_ia_execucoes_laboratorio.tipo_comparacao",
        tipos.rows as never,
      ),
      distribuicao(
        "resultados_casos",
        "atendimento_ia_resultados_laboratorio",
        resultados.rows as never,
      ),
      distribuicao(
        "ferramentas_simuladas",
        "atendimento_ia_resultados_laboratorio.ferramentas_simuladas",
        ferramentas.rows as never,
      ),
      distribuicao(
        "violacoes_laboratorio",
        "atendimento_ia_resultados_laboratorio.violacoes",
        violacoes.rows as never,
      ),
    ],
    indicadores: [
      metrica(
        "execucoes_laboratorio_total",
        total,
        total,
        "atendimento_ia_execucoes_laboratorio",
      ),
      metrica(
        "tokens_entrada_laboratorio",
        linha.entrada,
        total,
        "atendimento_ia_execucoes_laboratorio",
        "tokens",
      ),
      metrica(
        "tokens_saida_laboratorio",
        linha.saida,
        total,
        "atendimento_ia_execucoes_laboratorio",
        "tokens",
      ),
      metrica(
        "custo_laboratorio",
        linha.custo,
        total,
        "atendimento_ia_execucoes_laboratorio",
        "micros",
      ),
      metrica(
        "duracao_media_laboratorio",
        linha.duracao,
        linha.duracoes,
        "atendimento_ia_execucoes_laboratorio",
        "milissegundos",
      ),
    ],
  };
}
