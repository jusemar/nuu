import type { ClasseRetencaoAdmin } from "../../../types/admin/metricas";

export function classificarRetencao(fonte: string): ClasseRetencaoAdmin {
  if (
    /publica|versao_publicada|restauracao|auditoria|hash|identidade/i.test(
      fonte,
    )
  )
    return "permanente";
  if (/avaliacao|revisao|proposta|evidencia/i.test(fonte))
    return "vinte_quatro_meses";
  if (/laboratorio|resultado_lab/i.test(fonte)) return "doze_meses";
  return "noventa_dias";
}
