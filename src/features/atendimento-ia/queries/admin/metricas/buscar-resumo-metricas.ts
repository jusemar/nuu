import "server-only";

import type {
  PainelMetricasAdmin,
  PeriodoMetricasAdmin,
  ResultadoDryRunRetencao,
} from "../../../types/admin/metricas";
import { buscarAcessoAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { buscarDistribuicaoAvaliacoes } from "./buscar-distribuicao-avaliacoes";
import { buscarFalhasFerramentas } from "./buscar-falhas-ferramentas";
import { buscarMetricasAtendimento } from "./buscar-metricas-atendimento";
import { buscarMetricasLaboratorio } from "./buscar-metricas-laboratorio";
import { buscarMetricasPublicacoes } from "./buscar-metricas-publicacoes";
import { buscarMetricasRetencao } from "./buscar-metricas-retencao";
import { buscarMetricasTreinamento } from "./buscar-metricas-treinamento";
import { buscarSaudeDados } from "./buscar-saude-dados";
import { buscarSeriesTemporais } from "./buscar-series-temporais";

const retencaoRestrita = (agora: Date): ResultadoDryRunRetencao => ({
  executadoEm: agora,
  itens: [],
  modo: "dry_run",
  registrosExcluidos: 0,
});

export async function buscarResumoMetricas(
  periodo: PeriodoMetricasAdmin,
): Promise<PainelMetricasAdmin> {
  const acesso = await buscarAcessoAtendimentoIa();
  if (!acesso?.capacidades.includes("metricas_leitura"))
    throw new Error("ACESSO_METRICAS_NEGADO");
  const agora = new Date();
  const podeRetencao = acesso.capacidades.includes("acoes_criticas_execucao");
  const [
    atendimento,
    treinamento,
    laboratorio,
    publicacoes,
    avaliacoes,
    ferramentas,
    series,
    retencao,
  ] = await Promise.all([
    buscarMetricasAtendimento(periodo),
    buscarMetricasTreinamento(periodo),
    buscarMetricasLaboratorio(periodo),
    buscarMetricasPublicacoes(periodo),
    buscarDistribuicaoAvaliacoes(periodo),
    buscarFalhasFerramentas(periodo),
    buscarSeriesTemporais(periodo),
    podeRetencao
      ? buscarMetricasRetencao(agora)
      : Promise.resolve(retencaoRestrita(agora)),
  ]);
  const vencidos = retencao.itens.reduce(
    (soma, item) => soma + item.elegiveis,
    0,
  );
  const saude = await buscarSaudeDados(periodo, vencidos);
  return {
    atendimento: {
      distribuicoes: [
        ...atendimento.distribuicoes,
        ...avaliacoes.distribuicoes,
        ...ferramentas.distribuicoes,
      ],
      indicadores: [...atendimento.indicadores, ...avaliacoes.indicadores],
    },
    laboratorio,
    periodo,
    publicacoes,
    retencao,
    saude,
    series,
    treinamento,
    atualizadoEm: agora,
  };
}
