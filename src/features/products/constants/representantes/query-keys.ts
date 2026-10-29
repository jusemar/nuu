export const chavesProdutosRepresentante = {
  todas: ["produtos-representante"] as const,
  perfil: () => [...chavesProdutosRepresentante.todas, "perfil"] as const,
  lista: (busca: string, pagina: number) =>
    [...chavesProdutosRepresentante.todas, "lista", busca, pagina] as const,
  opcoes: () => [...chavesProdutosRepresentante.todas, "opcoes"] as const,
  produto: (produtoId: string, fornecedorId: string) =>
    [
      ...chavesProdutosRepresentante.todas,
      "produto",
      produtoId,
      fornecedorId,
    ] as const,
};
