import type {
  CAPACIDADES_ATENDIMENTO_IA_ADMIN,
  PAPEIS_ATENDIMENTO_IA_ADMIN,
} from "../../constants/admin/capacidades";

export type PapelAtendimentoIaAdmin =
  (typeof PAPEIS_ATENDIMENTO_IA_ADMIN)[number];
export type CapacidadeAtendimentoIaAdmin =
  (typeof CAPACIDADES_ATENDIMENTO_IA_ADMIN)[number];

export type AcessoAtendimentoIaAdmin = {
  ativo: true;
  capacidades: CapacidadeAtendimentoIaAdmin[];
  capacidadesAdicionais: CapacidadeAtendimentoIaAdmin[];
  papelAtribuicaoId: string;
  origem: "atribuicao_explicita" | "bootstrap_admin_emails";
  papel: PapelAtendimentoIaAdmin;
  usuarioId: string;
};
