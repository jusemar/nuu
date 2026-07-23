import type { FormaEntregaPromocional } from "../types/promocoes.types";

export function normalizarFormaEntregaPromocional(
  formaEntrega?: string | null,
): FormaEntregaPromocional | null {
  if (
    formaEntrega === "entrega-propria" ||
    formaEntrega === "frete-externo" ||
    formaEntrega === "retirada"
  ) {
    return formaEntrega;
  }

  return null;
}
