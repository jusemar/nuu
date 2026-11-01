export const chavesPainelComissoes = {
  todas: ["painel-comissoes"] as const,
  lista: (filtros: unknown) =>
    [...chavesPainelComissoes.todas, "lista", filtros] as const,
  detalhe: (id: string) =>
    [...chavesPainelComissoes.todas, "detalhe", id] as const,
  opcoes: () => [...chavesPainelComissoes.todas, "opcoes"] as const,
};
