import type { BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN } from "../../constants/admin/bloqueios-publicacao";
import type {
  CRITICIDADES_ADMIN,
  ESTADOS_EXECUCAO_LABORATORIO_ADMIN,
  MODOS_TESTE_ADMIN,
  RESULTADOS_ADMIN,
} from "../../constants/admin/estados";

export type CriticidadeAdmin = (typeof CRITICIDADES_ADMIN)[number];
export type ModoTesteAdmin = (typeof MODOS_TESTE_ADMIN)[number];
export type EstadoExecucaoLaboratorioAdmin =
  (typeof ESTADOS_EXECUCAO_LABORATORIO_ADMIN)[number];
export type ResultadoTesteAdmin = (typeof RESULTADOS_ADMIN)[number];
export type BloqueioCriticoPublicacaoAdmin =
  (typeof BLOQUEIOS_CRITICOS_PUBLICACAO_ADMIN)[number];

export type CandidatoLaboratorioAdmin = {
  identificador: string;
  tipo: "conhecimento" | "comportamento" | "lote";
  versao: number;
};

export type CasoTesteAdmin = {
  bloqueiaPublicacao: boolean;
  criticidade: CriticidadeAdmin;
  entrada: string;
  expectativas: string[];
  ferramentasProibidas: string[];
  ferramentasRequeridas: string[];
  nome: string;
};
