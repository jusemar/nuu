import type {
  BloqueioPublicacao,
  EvidenciaRevisaoPublicacao,
} from "../../../types/admin/publicacao";
export function validarRevisoesPublicacao(
  revisao: EvidenciaRevisaoPublicacao,
): BloqueioPublicacao[] {
  const bloqueios: BloqueioPublicacao[] = [];
  if (
    revisao.estado === "ausente" ||
    revisao.estado === "cancelada" ||
    revisao.estado === "substituida"
  )
    bloqueios.push("revisao_obrigatoria_ausente");
  if (revisao.estado === "reprovada") bloqueios.push("revisao_reprovada");
  if (revisao.estado === "aprovada" && !revisao.aprovadorTinhaCapacidade)
    bloqueios.push("aprovador_sem_capacidade");
  if (
    revisao.estado === "aprovada" &&
    revisao.autorId === revisao.aprovadorId &&
    revisao.outrosDecisoresAtivos > 0
  )
    bloqueios.push("autoaprovacao_proibida");
  if (revisao.revisadoEm && revisao.atualizadoEm > revisao.revisadoEm)
    bloqueios.push("versao_modificada_apos_aprovacao");
  return bloqueios;
}
