import "server-only";

import { and, count, gte, lte, sql } from "drizzle-orm";

import { atendimentoIaAuditoriasTable, atendimentoIaExecucoesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { EVENTOS_METRICAS_COMPROVAVEIS, VERSAO_METRICAS } from "../constants/seguranca-observabilidade";

export type AcessoMetricasInternas = { finalidade: "operacao" | "seguranca"; permissao: "atendimento_ia_metricas_leitura"; usuarioInternoId: string };

export async function consultarMetricasOperacionais(dados: { acesso: AcessoMetricasInternas; ate: Date; desde: Date }) {
  if (
    !dados.acesso.usuarioInternoId ||
    dados.acesso.permissao !== "atendimento_ia_metricas_leitura" ||
    !["operacao", "seguranca"].includes(dados.acesso.finalidade) ||
    dados.ate <= dados.desde
  ) throw new Error("ACESSO_METRICAS_NAO_AUTORIZADO");
  const eventos = await dbTransacional.select({ evento: atendimentoIaAuditoriasTable.evento, total: count() })
    .from(atendimentoIaAuditoriasTable)
    .where(and(gte(atendimentoIaAuditoriasTable.criadoEm, dados.desde), lte(atendimentoIaAuditoriasTable.criadoEm, dados.ate)))
    .groupBy(atendimentoIaAuditoriasTable.evento);
  const execucoes = await dbTransacional.select({
    duracaoMediaMs: sql<number>`coalesce(avg(${atendimentoIaExecucoesTable.duracaoEmMs}), 0)`,
    modelo: atendimentoIaExecucoesTable.modelo,
    tokensEntrada: sql<number>`coalesce(sum(${atendimentoIaExecucoesTable.tokensEntrada}), 0)`,
    tokensSaida: sql<number>`coalesce(sum(${atendimentoIaExecucoesTable.tokensSaida}), 0)`,
    total: count(),
  }).from(atendimentoIaExecucoesTable)
    .where(and(gte(atendimentoIaExecucoesTable.iniciadoEm, dados.desde), lte(atendimentoIaExecucoesTable.iniciadoEm, dados.ate)))
    .groupBy(atendimentoIaExecucoesTable.modelo);
  const permitidos = new Set<string>(EVENTOS_METRICAS_COMPROVAVEIS);
  return {
    eventos: eventos.filter((item) => permitidos.has(item.evento)),
    execucoes,
    periodo: { ate: dados.ate, desde: dados.desde },
    versao: VERSAO_METRICAS,
  };
}
