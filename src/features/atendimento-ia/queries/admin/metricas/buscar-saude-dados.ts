import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

import { avaliarSaudeDados } from "../../../lib/admin/observabilidade/avaliar-saude-dados";
import { criarAlertasOperacionais } from "../../../lib/admin/observabilidade/politica-alertas-operacionais";
import type { PeriodoMetricasAdmin } from "../../../types/admin/metricas";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { numero } from "./auxiliares-metricas";

export async function buscarSaudeDados(
  periodo: PeriodoMetricasAdmin,
  retencaoVencida = 0,
) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const duracaoPeriodo = periodo.ate.getTime() - periodo.desde.getTime();
  const anteriorDesde = new Date(periodo.desde.getTime() - duracaoPeriodo);
  const limiteLaboratorio = new Date(Date.now() - 3_600_000);
  const resultado = await db.execute(sql`
    select
      (select count(*) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}) execucoes,
      (select count(*) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and status in ('falhou','limite_excedido')) falhas,
      (select count(*) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and fallback_comportamento=true) fallback,
      (select count(*) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and (hash_configuracao_efetiva is null or identidade_publicacao is null)) sem_rastreabilidade,
      (select count(*) from atendimento_ia_execucoes e where e.tipo_execucao='publica' and e.iniciado_em >= ${periodo.desde} and e.iniciado_em < ${periodo.ate} and e.identidade_publicacao is not null and not exists(select 1 from atendimento_ia_publicacoes p where p.identidade=e.identidade_publicacao and p.status='concluida')) inconsistencia_publicacao,
      (select count(*) from atendimento_ia_documento_versoes where estado='publicado')+(select count(*) from atendimento_ia_comportamento_versoes where estado='publicado') publicadas,
      (select count(*) from atendimento_ia_documento_versoes where estado='publicado' and (length(trim(conteudo))=0 or length(trim(hash_conteudo))=0))+(select count(*) from atendimento_ia_comportamento_versoes where estado='publicado' and length(trim(hash))=0) publicacao_sem_conteudo,
      (select count(*) from (select nome_ferramenta from atendimento_ia_execucoes_ferramentas where iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate} and status='falhou' group by nome_ferramenta having count(*)>=3) f) ferramenta_falha_repetida,
      (select avg(duracao_em_ms) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}) duracao_atual,
      (select avg(duracao_em_ms) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${anteriorDesde} and iniciado_em < ${periodo.desde}) duracao_anterior,
      (select avg(tokens_entrada+tokens_saida) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}) tokens_atual,
      (select avg(tokens_entrada+tokens_saida) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${anteriorDesde} and iniciado_em < ${periodo.desde}) tokens_anterior,
      (select avg(custo_estimado_micros) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${periodo.desde} and iniciado_em < ${periodo.ate}) custo_atual,
      (select avg(custo_estimado_micros) from atendimento_ia_execucoes where tipo_execucao='publica' and iniciado_em >= ${anteriorDesde} and iniciado_em < ${periodo.desde}) custo_anterior,
      (select count(*) from atendimento_ia_execucoes_laboratorio where status='processando' and iniciado_em < ${limiteLaboratorio}) laboratorio_parado,
      (select count(*) from atendimento_ia_resultados_laboratorio r join atendimento_ia_caso_teste_versoes v on v.id=r.caso_teste_versao_id join atendimento_ia_casos_teste c on c.id=v.caso_teste_id where c.criticidade='critica' and coalesce(r.decisao_humana,r.resultado_automatico) in ('reprovado','bloqueado')) regressao_critica`);
  const linha = resultado.rows[0] ?? {};
  const aumentou = (atual: unknown, anterior: unknown) =>
    numero(anterior) > 0 && numero(atual) > numero(anterior) * 1.5;
  return avaliarSaudeDados(
    criarAlertasOperacionais({
      aumentoCusto: aumentou(linha.custo_atual, linha.custo_anterior),
      aumentoDuracao: aumentou(linha.duracao_atual, linha.duracao_anterior),
      aumentoTokens: aumentou(linha.tokens_atual, linha.tokens_anterior),
      execucoes: numero(linha.execucoes),
      falhas: numero(linha.falhas),
      fallback: numero(linha.fallback),
      ferramentaFalhaRepetida: numero(linha.ferramenta_falha_repetida),
      inconsistenciaPublicacao: numero(linha.inconsistencia_publicacao),
      laboratorioParado: numero(linha.laboratorio_parado),
      publicacaoSemConteudo: numero(linha.publicacao_sem_conteudo),
      regressaoCritica: numero(linha.regressao_critica),
      retencaoVencida,
      semRastreabilidade: numero(linha.sem_rastreabilidade),
      versoesPublicadas: numero(linha.publicadas),
    }),
  );
}
