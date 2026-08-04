import type { ClasseRetencaoAdmin } from "../../../types/admin/metricas";

export const POLITICA_RETENCAO_ATENDIMENTO_IA: Record<
  ClasseRetencaoAdmin,
  { dias: number | null; meses: number | null; permanente: boolean }
> = {
  permanente: { dias: null, meses: null, permanente: true },
  vinte_quatro_meses: { dias: null, meses: 24, permanente: false },
  doze_meses: { dias: null, meses: 12, permanente: false },
  noventa_dias: { dias: 90, meses: null, permanente: false },
};
