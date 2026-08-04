import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { distribuicao, metrica } from "./auxiliares-metricas";

export async function buscarMetricasTreinamento(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [
    conhecimentos,
    faqs,
    comportamentos,
    propostas,
    revisoes,
    versoes,
    tempoRevisao,
    auditorias,
  ] = await Promise.all([
    db.execute(
      sql`select situacao::text nome, count(*) total from atendimento_ia_documentos_institucionais group by situacao order by situacao`,
    ),
    db.execute(
      sql`select v.estado::text nome, count(*) total from atendimento_ia_documento_versoes v join atendimento_ia_documentos_institucionais d on d.id=v.documento_id where d.tipo_conhecimento='pergunta_resposta' group by v.estado order by v.estado`,
    ),
    db.execute(
      sql`select v.estado::text nome, count(*) total from atendimento_ia_comportamento_versoes v group by v.estado order by v.estado`,
    ),
    db.execute(
      sql`select status::text nome, count(*) total from atendimento_ia_propostas_melhoria where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by status order by status`,
    ),
    db.execute(
      sql`select status::text nome, count(*) total from atendimento_ia_revisoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by status order by status`,
    ),
    db.execute(
      sql`select estado::text nome, count(*) total from (select estado, criado_em from atendimento_ia_documento_versoes union all select estado, criado_em from atendimento_ia_comportamento_versoes) v where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by estado order by estado`,
    ),
    db.execute(
      sql`select count(*) total, avg(extract(epoch from (decidido_em-criado_em))*1000) media from atendimento_ia_revisoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and decidido_em is not null`,
    ),
    db.execute(
      sql`select count(*) total from atendimento_ia_auditorias where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and categoria in ('operacao','seguranca','privacidade')`,
    ),
  ]);
  const linhaTempo = tempoRevisao.rows[0] ?? {};
  const linhaAuditoria = auditorias.rows[0] ?? {};
  return {
    distribuicoes: [
      distribuicao(
        "conhecimentos_por_estado",
        "atendimento_ia_documentos_institucionais.situacao",
        conhecimentos.rows as never,
      ),
      distribuicao(
        "faqs_por_estado",
        "atendimento_ia_documento_versoes + tipo pergunta_resposta",
        faqs.rows as never,
      ),
      distribuicao(
        "comportamentos_por_estado",
        "atendimento_ia_comportamento_versoes.estado",
        comportamentos.rows as never,
      ),
      distribuicao(
        "versoes_por_estado",
        "versões de conhecimento e comportamento",
        versoes.rows as never,
      ),
      distribuicao(
        "propostas_por_estado",
        "atendimento_ia_propostas_melhoria.status",
        propostas.rows as never,
      ),
      distribuicao(
        "revisoes_por_estado",
        "atendimento_ia_revisoes.status",
        revisoes.rows as never,
      ),
    ],
    indicadores: [
      metrica(
        "tempo_medio_revisao",
        linhaTempo.media,
        linhaTempo.total,
        "atendimento_ia_revisoes",
        "milissegundos",
      ),
      metrica(
        "auditorias_relevantes",
        linhaAuditoria.total,
        linhaAuditoria.total,
        "atendimento_ia_auditorias",
      ),
    ],
  };
}
