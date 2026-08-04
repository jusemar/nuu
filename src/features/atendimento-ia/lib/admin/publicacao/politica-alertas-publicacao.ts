import type { AlertaPublicacao } from "../../../types/admin/publicacao";
export function aplicarPoliticaAlertas(alertas: AlertaPublicacao[] = []) {
  const unicos = [...new Set(alertas)].sort();
  return { alertas: unicos, exigeJustificativaFutura: unicos.length > 0 };
}
