import type { ClasseRetencaoAdmin } from "../../../types/admin/metricas";
import { POLITICA_RETENCAO_ATENDIMENTO_IA } from "./politica-retencao";

export function calcularExpiracaoRegistro(
  criadoEm: Date,
  classe: ClasseRetencaoAdmin,
) {
  const politica = POLITICA_RETENCAO_ATENDIMENTO_IA[classe];
  if (politica.permanente) return null;
  const expiracao = new Date(criadoEm);
  if (politica.meses)
    expiracao.setUTCMonth(expiracao.getUTCMonth() + politica.meses);
  else expiracao.setUTCDate(expiracao.getUTCDate() + politica.dias!);
  return expiracao;
}
