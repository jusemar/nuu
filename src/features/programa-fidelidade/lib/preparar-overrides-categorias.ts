import type { RegraCategoriaFidelidade } from "../types/programa-fidelidade.types";

export type OverrideCategoriaFidelidade = {
  categoriaId: string;
  ativa: boolean;
  pontosPorReal: string | null;
};

/** Mantém no banco apenas exceções; regra padrão ativa é herdada, não copiada. */
export function prepararOverridesCategorias(
  regras: RegraCategoriaFidelidade[],
): OverrideCategoriaFidelidade[] {
  return regras
    .filter((regra) => regra.personalizada || !regra.ativa)
    .map((regra) => ({
      categoriaId: regra.categoriaId,
      ativa: regra.ativa,
      pontosPorReal: regra.personalizada ? String(regra.pontosPorReal) : null,
    }));
}
