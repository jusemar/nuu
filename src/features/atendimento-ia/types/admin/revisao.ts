import type {
  CATEGORIAS_PROPOSTA_MELHORIA_ADMIN,
  ESTADOS_PROPOSTA_MELHORIA_ADMIN,
  ESTADOS_REVISAO_ADMIN,
} from "../../constants/admin/estados";
import type {
  CLASSIFICACOES_PROBLEMA_ADMIN,
  DECISOES_AVALIACAO_ADMIN,
  NOTAS_AVALIACAO_ADMIN,
} from "../../constants/admin/rubricas";

export type EstadoRevisaoAdmin = (typeof ESTADOS_REVISAO_ADMIN)[number];
export type NotaAvaliacaoAdmin = (typeof NOTAS_AVALIACAO_ADMIN)[number];
export type DecisaoAvaliacaoAdmin = (typeof DECISOES_AVALIACAO_ADMIN)[number];
export type ClassificacaoProblemaAdmin =
  (typeof CLASSIFICACOES_PROBLEMA_ADMIN)[number];
export type EstadoPropostaMelhoriaAdmin =
  (typeof ESTADOS_PROPOSTA_MELHORIA_ADMIN)[number];
export type CategoriaPropostaMelhoriaAdmin =
  (typeof CATEGORIAS_PROPOSTA_MELHORIA_ADMIN)[number];

export type AvaliacaoRespostaAdmin = {
  classificacaoProblema: ClassificacaoProblemaAdmin;
  comentario?: string;
  decisao: DecisaoAvaliacaoAdmin;
  mensagemId: string;
  nota: NotaAvaliacaoAdmin;
  versaoRubrica: string;
};

export type PropostaMelhoriaAdmin = {
  categoria: CategoriaPropostaMelhoriaAdmin;
  criterioAceite: string;
  descricao: string;
  estado: EstadoPropostaMelhoriaAdmin;
  impacto: "baixo" | "medio" | "alto";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  risco: "baixo" | "medio" | "alto" | "critico";
  titulo: string;
};
