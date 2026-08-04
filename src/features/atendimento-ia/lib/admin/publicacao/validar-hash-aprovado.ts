import type {
  BloqueioPublicacao,
  EvidenciaRevisaoPublicacao,
} from "../../../types/admin/publicacao";
export function validarHashAprovado(
  hashAtual: string,
  revisao: EvidenciaRevisaoPublicacao,
): BloqueioPublicacao[] {
  if (!revisao.hashAprovado) return [];
  return revisao.hashAprovado === hashAtual
    ? []
    : ["hash_aprovado_divergente", "versao_modificada_apos_aprovacao"];
}
