"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { atendimentoIaAuditoriasTable } from "@/db/tables/atendimento-ia";

import { buscarMetricasRetencao } from "../../queries/admin/metricas/buscar-metricas-retencao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";

/** Executa somente o relatório; não existe caminho de exclusão física neste bloco. */
export async function executarDryRunRetencao() {
  const ator = await exigirCapacidadeAtendimentoIa("acoes_criticas_execucao");
  const resultado = await buscarMetricasRetencao();
  await db.insert(atendimentoIaAuditoriasTable).values({
    acao: "executar_dry_run_retencao",
    autorizacao: "permitida",
    categoria: "operacao",
    evento: "atendimento_ia_retencao_dry_run_executado",
    identificadorAtor: ator.usuarioId,
    metadados: {
      fontes: resultado.itens.length,
      registrosElegiveis: resultado.itens.reduce(
        (soma, item) => soma + item.elegiveis,
        0,
      ),
      registrosExcluidos: 0,
    },
    resultado: "sucesso_comprovado",
    severidade: "informativo",
    tipoAtor: "usuario_admin",
    usuarioId: ator.usuarioId,
    versoes: { politicaRetencaoAtendimentoIa: "v1" },
  });
  revalidatePath("/admin/atendente-ia/treinamento/metricas");
}
