import { RETENCAO_ADMIN } from "../../../constants/admin/retencao";

export function calcularExpiracaoRevisao(referencia = new Date()) {
  const expiracao = new Date(referencia);
  expiracao.setUTCDate(expiracao.getUTCDate() + RETENCAO_ADMIN.avaliacoes.dias);
  return expiracao;
}
