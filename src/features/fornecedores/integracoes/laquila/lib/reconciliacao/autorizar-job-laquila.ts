import { timingSafeEqual } from "node:crypto";

/** Sem configuração explícita o job fecha antes de tocar banco ou fornecedor. */
export function autorizarJobLaquila(
  authorization: string | null,
  segredo: string | undefined,
) {
  const esperado = segredo?.trim();
  const recebido = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!esperado || !recebido) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  return a.length === b.length && timingSafeEqual(a, b);
}
