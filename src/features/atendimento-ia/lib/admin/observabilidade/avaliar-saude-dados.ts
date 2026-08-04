import type {
  AlertaOperacionalAdmin,
  SaudeDadosAdmin,
} from "../../../types/admin/metricas";

export function avaliarSaudeDados(
  alertas: AlertaOperacionalAdmin[],
  agora = new Date(),
): SaudeDadosAdmin {
  const status = alertas.some((item) => item.severidade === "critico")
    ? "critico"
    : alertas.length
      ? "atencao"
      : "saudavel";
  return {
    alertas: alertas.toSorted((a, b) => a.codigo.localeCompare(b.codigo)),
    atualizadoEm: agora,
    status,
  };
}
