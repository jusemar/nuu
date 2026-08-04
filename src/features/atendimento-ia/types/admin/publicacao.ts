import type { BLOQUEIOS_ELEGIBILIDADE_PUBLICACAO } from "../../constants/admin/bloqueios-publicacao";
export const TIPOS_CANDIDATO_PUBLICACAO = [
  "conhecimento",
  "pergunta_resposta",
  "comportamento",
  "lote",
] as const;
export const STATUS_ELEGIBILIDADE_PUBLICACAO = [
  "elegivel",
  "bloqueado",
  "aguardando_revisao",
  "aguardando_testes",
  "obsoleto",
] as const;
export const ALERTAS_PUBLICACAO = [
  "problema_leve_tom",
  "resposta_excessivamente_longa",
  "pequena_perda_concisao",
  "diferenca_estilistica",
  "aumento_aceitavel_latencia",
  "aumento_aceitavel_custo",
  "caso_baixa_criticidade_inconclusivo",
] as const;
export type BloqueioPublicacao =
  (typeof BLOQUEIOS_ELEGIBILIDADE_PUBLICACAO)[number];
export type AlertaPublicacao = (typeof ALERTAS_PUBLICACAO)[number];
export type TipoCandidatoPublicacao =
  (typeof TIPOS_CANDIDATO_PUBLICACAO)[number];
export type StatusElegibilidadePublicacao =
  (typeof STATUS_ELEGIBILIDADE_PUBLICACAO)[number];
export type EvidenciaRevisaoPublicacao = {
  estado: "aprovada" | "reprovada" | "cancelada" | "substituida" | "ausente";
  hashAprovado: string | null;
  aprovadorId: string | null;
  aprovadorTinhaCapacidade: boolean;
  autorId: string | null;
  outrosDecisoresAtivos: number;
  revisadoEm: Date | null;
  atualizadoEm: Date;
};
export type EvidenciaResultadoLaboratorio = {
  execucaoId: string;
  status: string;
  hashesCongelados: Record<string, string>;
  resultado: string;
  criticidade: "baixa" | "media" | "alta" | "critica";
  obrigatorio: boolean;
  bloqueiaPublicacao: boolean;
  conflitos: string[];
  fontesAusentes: string[];
  necessidadeConsultaReal: boolean;
  violacoes: string[];
  casoTesteVersaoId: string;
};
export type EntradaElegibilidadePublicacao = {
  tipo: TipoCandidatoPublicacao;
  candidatoId: string;
  hashAtual: string;
  itensLote?: Array<{
    id: string;
    versao: number;
    hash: string;
    ordem: number;
  }>;
  comportamentoCandidato?: { id: string; hash: string } | null;
  conjuntoTesteId?: string | null;
  revisao: EvidenciaRevisaoPublicacao;
  resultados: EvidenciaResultadoLaboratorio[];
  casosObrigatorios: Array<{
    id: string;
    criticidade: "baixa" | "media" | "alta" | "critica";
    obrigatorio: boolean;
    bloqueiaPublicacao: boolean;
  }>;
  alertasDetectados?: AlertaPublicacao[];
};
export type ElegibilidadePublicacao = {
  tipo: TipoCandidatoPublicacao;
  candidatoId: string;
  identidadeCandidato: string;
  hashAvaliado: string;
  status: StatusElegibilidadePublicacao;
  elegivel: boolean;
  bloqueios: BloqueioPublicacao[];
  alertas: AlertaPublicacao[];
  exigeJustificativaFutura: boolean;
  revisaoConsiderada: EvidenciaRevisaoPublicacao;
  execucoesConsideradas: string[];
  casosObrigatorios: string[];
  avaliadoEm: Date;
};
