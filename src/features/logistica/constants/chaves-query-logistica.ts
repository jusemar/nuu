export const chavesPrevisaoEntregaProduto = {
  todas: ["logistica", "previsao-entrega-produto"] as const,
  lote: (produtosIds: string[], cep: string) =>
    [
      ...chavesPrevisaoEntregaProduto.todas,
      "lote",
      cep,
      ...produtosIds,
    ] as const,
};

export const chaveCepEnderecoCliente = [
  "logistica",
  "cep-endereco-cliente",
] as const;
