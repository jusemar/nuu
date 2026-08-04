import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { distribuicao, metrica, numero } from "./auxiliares-metricas";

export async function buscarMetricasPublicacoes(periodo: PeriodoMetricasAdmin) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const [status, tipos, resumo, restauracoes, bloqueios] = await Promise.all([
    db.execute(
      sql`select status nome, count(*) total from atendimento_ia_publicacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by status order by status`,
    ),
    db.execute(
      sql`select tipo nome, count(*) total from atendimento_ia_publicacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} group by tipo order by tipo`,
    ),
    db.execute(
      sql`select count(*) total, count(*) filter(where status='concluida') concluidas, count(*) filter(where justificativa_alertas is not null) com_alertas from atendimento_ia_publicacoes where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate}`,
    ),
    db.execute(
      sql`select count(*) total from atendimento_ia_auditorias where criado_em >= ${periodo.desde} and criado_em < ${periodo.ate} and evento like 'atendimento_ia_restauracao_%_concluida'`,
    ),
    db.execute(
      sql`select coalesce(motivo_bloqueio,'sem_motivo_registrado') nome, count(*) total from (select motivo_bloqueio from atendimento_ia_documento_versoes where publicacao_bloqueada=true union all select motivo_bloqueio from atendimento_ia_comportamento_versoes where publicacao_bloqueada=true) b group by motivo_bloqueio order by count(*) desc, motivo_bloqueio limit 50`,
    ),
  ]);
  const linha = resumo.rows[0] ?? {};
  const total = numero(linha.total);
  return {
    distribuicoes: [
      distribuicao(
        "publicacoes_por_status",
        "atendimento_ia_publicacoes.status",
        status.rows as never,
      ),
      distribuicao(
        "publicacoes_por_tipo",
        "atendimento_ia_publicacoes.tipo",
        tipos.rows as never,
      ),
      distribuicao(
        "motivos_bloqueio",
        "versões.publicacao_bloqueada",
        bloqueios.rows as never,
      ),
    ],
    indicadores: [
      metrica("publicacoes_total", total, total, "atendimento_ia_publicacoes"),
      metrica(
        "publicacoes_concluidas",
        linha.concluidas,
        total,
        "atendimento_ia_publicacoes.status",
      ),
      metrica(
        "alertas_nao_bloqueadores",
        linha.com_alertas,
        total,
        "atendimento_ia_publicacoes.justificativa_alertas",
      ),
      metrica(
        "restauracoes",
        restauracoes.rows[0]?.total,
        restauracoes.rows[0]?.total,
        "atendimento_ia_auditorias.evento",
      ),
    ],
  };
}
