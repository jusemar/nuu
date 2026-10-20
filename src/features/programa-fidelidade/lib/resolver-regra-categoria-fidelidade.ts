export type RegraCategoriaFidelidadePersistida = {
  ativa: boolean;
  pontosPorReal: string | null;
};

/**
 * Resolve a elegibilidade em um único lugar. No modelo opt-in, não existir uma
 * regra é uma decisão segura: a categoria não participa do programa.
 */
export function resolverRegraCategoriaFidelidade(
  regra: RegraCategoriaFidelidadePersistida | null | undefined,
  pontosPorRealGlobal: string,
) {
  return {
    participa: regra?.ativa === true,
    origemRegra: regra?.pontosPorReal ? "personalizada" : "global",
    pontosPorReal: regra?.pontosPorReal ?? pontosPorRealGlobal,
  } as const;
}
