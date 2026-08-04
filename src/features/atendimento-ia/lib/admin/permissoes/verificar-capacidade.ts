import type {
  AcessoAtendimentoIaAdmin,
  CapacidadeAtendimentoIaAdmin,
} from "../../../types/admin/permissoes";

export function verificarCapacidadeAtendimentoIa(
  acesso: AcessoAtendimentoIaAdmin | null,
  capacidade: CapacidadeAtendimentoIaAdmin,
) {
  return Boolean(acesso?.ativo && acesso.capacidades.includes(capacidade));
}
