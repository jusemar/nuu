import type {
  ContextoCalculoPromocao,
  EntradaCalculoPromocoes,
} from "../types/promocoes.types";

export function normalizarContextoPromocao(
  entrada: EntradaCalculoPromocoes,
): ContextoCalculoPromocao {
  const codigosCupons = (entrada.contexto?.codigosCupons ?? [])
    .map((codigo) => codigo.trim().toUpperCase())
    .filter(Boolean);

  return {
    dataReferencia: entrada.contexto?.dataReferencia ?? new Date(),
    subtotalEmCentavos: entrada.contexto?.subtotalEmCentavos ?? null,
    codigosCupons: [...new Set(codigosCupons)],
    clienteId: entrada.contexto?.clienteId ?? null,
  };
}
