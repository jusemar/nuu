export const chavesQueryVendaCruzada = {
  raiz: ["produtos", "venda-cruzada"] as const,
  configuracao: (produtoId: string) =>
    [...chavesQueryVendaCruzada.raiz, "configuracao", produtoId] as const,
  busca: (produtoId: string, busca: string) =>
    [...chavesQueryVendaCruzada.raiz, "busca", produtoId, busca] as const,
};
