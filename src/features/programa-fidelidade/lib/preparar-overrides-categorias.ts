import type { RegraCategoriaFidelidade } from "../types/programa-fidelidade.types";

export type OverrideCategoriaFidelidade = {
  categoriaId: string;
  ativa: boolean;
  pontosPorReal: string | null;
};

/**
 * Persiste somente opt-ins. Uma linha ativa com pontos nulos significa participação
 * explícita usando a taxa base; ausência de linha significa que não participa.
 */
export function prepararOverridesCategorias(
  regras: RegraCategoriaFidelidade[],
): OverrideCategoriaFidelidade[] {
  return regras
    .filter((regra) => regra.ativa)
    .map((regra) => ({
      categoriaId: regra.categoriaId,
      ativa: regra.ativa,
      pontosPorReal: regra.personalizada ? String(regra.pontosPorReal) : null,
    }));
}
