import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import { prepararDryRunRetencao } from "../../../lib/admin/retencao/preparar-dry-run-retencao";
import type { ItemDryRunRetencao } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { numero } from "./auxiliares-metricas";

export async function buscarMetricasRetencao(agora = new Date()) {
  await exigirCapacidadeAtendimentoIa("acoes_criticas_execucao");
  const em30Dias = new Date(agora.getTime() + 30 * 86_400_000);
  const [
    propostas,
    avaliacoes,
    revisoes,
    laboratorio,
    temporarios,
    permanente,
  ] = await Promise.all([
    db.execute(
      sql`select count(*) filter(where expira_em < ${agora}) elegiveis, count(*) filter(where expira_em >= ${agora} and expira_em < ${em30Dias}) proximos from atendimento_ia_propostas_melhoria`,
    ),
    db.execute(
      sql`select count(*) filter(where criado_em < ${agora} - interval '24 months') elegiveis, count(*) filter(where criado_em >= ${agora} - interval '25 months' and criado_em < ${agora} - interval '24 months') proximos from atendimento_ia_avaliacoes`,
    ),
    db.execute(
      sql`select count(*) filter(where criado_em < ${agora} - interval '24 months') elegiveis, count(*) filter(where criado_em >= ${agora} - interval '25 months' and criado_em < ${agora} - interval '24 months') proximos from atendimento_ia_revisoes`,
    ),
    db.execute(
      sql`select count(*) filter(where expira_em < ${agora}) elegiveis, count(*) filter(where expira_em >= ${agora} and expira_em < ${em30Dias}) proximos from atendimento_ia_execucoes_laboratorio`,
    ),
    db.execute(
      sql`select count(*) filter(where criado_em < ${agora} - interval '90 days') protegidos from atendimento_ia_ocorrencias`,
    ),
    db.execute(
      sql`select (select count(*) from atendimento_ia_publicacoes)+(select count(*) from atendimento_ia_auditorias)+(select count(*) from atendimento_ia_documento_versoes where estado='publicado')+(select count(*) from atendimento_ia_comportamento_versoes where estado='publicado') protegidos`,
    ),
  ]);
  const item = (
    fonte: string,
    classe: ItemDryRunRetencao["classe"],
    linha: Record<string, unknown>,
    protegidos = 0,
  ): ItemDryRunRetencao => ({
    fonte,
    classe,
    elegiveis: numero(linha.elegiveis),
    protegidos,
    vencemEm30Dias: numero(linha.proximos),
  });
  return prepararDryRunRetencao(
    [
      item(
        "atendimento_ia_propostas_melhoria",
        "vinte_quatro_meses",
        propostas.rows[0] ?? {},
      ),
      item(
        "atendimento_ia_avaliacoes",
        "vinte_quatro_meses",
        avaliacoes.rows[0] ?? {},
      ),
      item(
        "atendimento_ia_revisoes",
        "vinte_quatro_meses",
        revisoes.rows[0] ?? {},
      ),
      item(
        "atendimento_ia_execucoes_laboratorio",
        "doze_meses",
        laboratorio.rows[0] ?? {},
      ),
      item(
        "publicações, versões publicadas e auditorias",
        "permanente",
        {},
        numero(permanente.rows[0]?.protegidos),
      ),
      item(
        "falhas técnicas vinculadas ao atendimento público",
        "noventa_dias",
        {},
        numero(temporarios.rows[0]?.protegidos),
      ),
    ],
    agora,
  );
}
