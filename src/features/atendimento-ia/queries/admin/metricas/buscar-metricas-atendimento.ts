import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import { calcularPercentis } from "../../../lib/admin/observabilidade/calcular-percentis";
import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import {
  distribuicao,
  indisponivel,
  metrica,
  numero,
} from "./auxiliares-metricas";

export async function buscarMetricasAtendimento(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [totais, duracoes, modelos, transferencias, ocorrencias, rag] =
    await Promise.all([
      db.execute(sql`
      select
        (select count(*) from atendimento_ia_conversas where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate}) conversas,
        (select count(*) from atendimento_ia_mensagens where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate}) mensagens,
        count(*) execucoes,
        count(*) filter (where status in ('falhou','limite_excedido')) falhas,
        count(*) filter (where status='limite_excedido') limites,
        count(*) filter (where fallback_comportamento=true) fallback,
        count(*) filter (where identidade_publicacao is not null) publicacoes_usadas,
        count(*) filter (where comportamento_versao_id is not null or conhecimento_versoes_ids is not null) versoes_usadas,
        coalesce(sum(tokens_entrada),0) tokens_entrada,
        coalesce(sum(tokens_saida),0) tokens_saida,
        coalesce(sum(custo_estimado_micros),0) custo,
        avg(duracao_em_ms) filter (where duracao_em_ms is not null) duracao_media,
        count(duracao_em_ms) duracoes
      from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}`),
      db.execute(
        sql`select duracao_em_ms valor from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and duracao_em_ms is not null order by duracao_em_ms asc limit 10000`,
      ),
      db.execute(
        sql`select modelo nome, count(*) total from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} group by modelo order by count(*) desc, modelo limit 50`,
      ),
      db.execute(
        sql`select motivo nome, count(*) total from atendimento_ia_transferencias where solicitado_em >= ${periodo.desde} and solicitado_em < ${periodo.ate} group by motivo order by count(*) desc, motivo limit 50`,
      ),
      db.execute(
        sql`select tipo::text nome, count(*) total from atendimento_ia_ocorrencias where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by tipo order by tipo`,
      ),
      db.execute(
        sql`select status::text nome, count(*) total from atendimento_ia_buscas_rag where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by status order by status`,
      ),
    ]);
  const linha = totais.rows[0] ?? {};
  const execucoes = numero(linha.execucoes);
  const percentis = calcularPercentis(
    duracoes.rows.map((item) => numero(item.valor)),
  );
  const statusPercentis =
    numero(linha.duracoes) > duracoes.rows.length ? "parcial" : "real";
  return {
    distribuicoes: [
      distribuicao(
        "modelos_utilizados",
        "atendimento_ia_execucoes.modelo",
        modelos.rows as never,
      ),
      distribuicao(
        "motivos_transferencia",
        "atendimento_ia_transferencias.motivo",
        transferencias.rows as never,
      ),
      distribuicao(
        "ocorrencias",
        "atendimento_ia_ocorrencias.tipo",
        ocorrencias.rows as never,
      ),
      distribuicao(
        "rag",
        "atendimento_ia_buscas_rag.status",
        rag.rows as never,
      ),
    ],
    indicadores: [
      metrica(
        "conversas_total",
        linha.conversas,
        linha.conversas,
        "atendimento_ia_conversas",
      ),
      metrica(
        "mensagens_total",
        linha.mensagens,
        linha.mensagens,
        "atendimento_ia_mensagens",
      ),
      metrica(
        "execucoes_total",
        execucoes,
        execucoes,
        "atendimento_ia_execucoes",
      ),
      metrica(
        "falhas_total",
        linha.falhas,
        execucoes,
        "atendimento_ia_execucoes",
      ),
      metrica(
        "taxa_erro",
        execucoes ? (numero(linha.falhas) / execucoes) * 100 : null,
        execucoes,
        "atendimento_ia_execucoes",
        "percentual",
      ),
      metrica(
        "tokens_entrada",
        linha.tokens_entrada,
        execucoes,
        "atendimento_ia_execucoes",
        "tokens",
      ),
      metrica(
        "tokens_saida",
        linha.tokens_saida,
        execucoes,
        "atendimento_ia_execucoes",
        "tokens",
      ),
      metrica(
        "custo_persistido",
        linha.custo,
        execucoes,
        "atendimento_ia_execucoes.custo_estimado_micros",
        "micros",
      ),
      metrica(
        "duracao_media",
        linha.duracao_media,
        linha.duracoes,
        "atendimento_ia_execucoes.duracao_em_ms",
        "milissegundos",
      ),
      metrica(
        "duracao_p50",
        percentis.p50,
        percentis.quantidade,
        "atendimento_ia_execucoes.duracao_em_ms",
        "milissegundos",
        percentis.p50 === null ? "indisponivel" : statusPercentis,
      ),
      metrica(
        "duracao_p95",
        percentis.p95,
        percentis.quantidade,
        "atendimento_ia_execucoes.duracao_em_ms",
        "milissegundos",
        percentis.p95 === null ? "indisponivel" : statusPercentis,
      ),
      metrica(
        "duracao_p99",
        percentis.p99,
        percentis.quantidade,
        "atendimento_ia_execucoes.duracao_em_ms",
        "milissegundos",
        percentis.p99 === null ? "indisponivel" : statusPercentis,
      ),
      metrica(
        "fallback",
        linha.fallback,
        execucoes,
        "atendimento_ia_execucoes.fallback_comportamento",
      ),
      metrica(
        "limites_uso",
        linha.limites,
        execucoes,
        "atendimento_ia_execucoes.status",
      ),
      metrica(
        "versoes_administrativas_consumidas",
        linha.versoes_usadas,
        execucoes,
        "atendimento_ia_execucoes",
      ),
      metrica(
        "publicacoes_utilizadas",
        linha.publicacoes_usadas,
        execucoes,
        "atendimento_ia_execucoes.identidade_publicacao",
      ),
      indisponivel("fora_escopo", "evento específico não persistido"),
      metrica(
        "transferencias_humanas",
        transferencias.rows.reduce((s, item) => s + numero(item.total), 0),
        transferencias.rows.reduce((s, item) => s + numero(item.total), 0),
        "atendimento_ia_transferencias",
      ),
      metrica(
        "ocorrencias_total",
        ocorrencias.rows.reduce((s, item) => s + numero(item.total), 0),
        ocorrencias.rows.reduce((s, item) => s + numero(item.total), 0),
        "atendimento_ia_ocorrencias",
      ),
      metrica(
        "buscas_rag",
        rag.rows.reduce((s, item) => s + numero(item.total), 0),
        rag.rows.reduce((s, item) => s + numero(item.total), 0),
        "atendimento_ia_buscas_rag",
      ),
    ],
    totaisBrutos: {
      execucoes,
      falhas: numero(linha.falhas),
      fallback: numero(linha.fallback),
    },
  };
}
