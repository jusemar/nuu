import type { AlertaOperacionalAdmin } from "../../../types/admin/metricas";

export function criarAlertasOperacionais(dados: {
  aumentoCusto?: boolean;
  aumentoDuracao?: boolean;
  aumentoTokens?: boolean;
  execucoes: number;
  falhas: number;
  fallback: number;
  ferramentaFalhaRepetida?: number;
  inconsistenciaPublicacao?: number;
  laboratorioParado: number;
  publicacaoSemConteudo?: number;
  regressaoCritica: number;
  retencaoVencida: number;
  semRastreabilidade: number;
  versoesPublicadas: number;
}): AlertaOperacionalAdmin[] {
  const alertas: AlertaOperacionalAdmin[] = [];
  const adicionar = (
    codigo: string,
    descricao: string,
    fonte: string,
    severidade: "atencao" | "critico",
  ) => alertas.push({ codigo, descricao, fonte, severidade });
  if (!dados.versoesPublicadas)
    adicionar(
      "sem_versao_publicada",
      "Não há versão administrativa publicada.",
      "versões publicadas",
      "critico",
    );
  if (dados.execucoes && dados.falhas / dados.execucoes >= 0.1)
    adicionar(
      "falhas_recorrentes",
      "Taxa de falha igual ou superior a 10%.",
      "execuções públicas",
      "atencao",
    );
  if (dados.execucoes && dados.fallback / dados.execucoes >= 0.2)
    adicionar(
      "fallback_frequente",
      "Fallback presente em ao menos 20% das execuções.",
      "execuções públicas",
      "atencao",
    );
  if (dados.aumentoDuracao)
    adicionar(
      "aumento_duracao",
      "Duração média aumentou mais de 50% ante o período anterior.",
      "execuções públicas",
      "atencao",
    );
  if (dados.aumentoTokens)
    adicionar(
      "aumento_tokens",
      "Tokens médios aumentaram mais de 50% ante o período anterior.",
      "execuções públicas",
      "atencao",
    );
  if (dados.aumentoCusto)
    adicionar(
      "aumento_custo",
      "Custo médio persistido aumentou mais de 50% ante o período anterior.",
      "execuções públicas",
      "atencao",
    );
  if (dados.ferramentaFalhaRepetida)
    adicionar(
      "ferramenta_falha_repetida",
      "Há ferramenta com três ou mais falhas no período.",
      "execuções de ferramentas",
      "atencao",
    );
  if (dados.publicacaoSemConteudo)
    adicionar(
      "publicacao_sem_conteudo",
      "Há versão publicada sem conteúdo ou hash válido.",
      "versões publicadas",
      "critico",
    );
  if (dados.inconsistenciaPublicacao)
    adicionar(
      "inconsistencia_publicacao_execucao",
      "Há execução com identidade sem publicação concluída correspondente.",
      "execuções e publicações",
      "critico",
    );
  if (dados.semRastreabilidade)
    adicionar(
      "rastreabilidade_incompleta",
      "Há execuções sem hash ou identidade de rastreabilidade.",
      "execuções públicas",
      "critico",
    );
  if (dados.laboratorioParado)
    adicionar(
      "laboratorio_parado",
      "Há execução de laboratório em processamento há mais de uma hora.",
      "laboratório",
      "atencao",
    );
  if (dados.regressaoCritica)
    adicionar(
      "regressao_critica_pendente",
      "Há regressão crítica sem tratamento conclusivo.",
      "resultados do laboratório",
      "critico",
    );
  if (dados.retencaoVencida)
    adicionar(
      "retencao_vencida",
      "Há registros vencidos elegíveis para análise de retenção.",
      "política de retenção",
      "atencao",
    );
  return alertas;
}
