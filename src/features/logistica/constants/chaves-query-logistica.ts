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

/** Cadeia de categorias usada para exibir o Frete Externo efetivo no Admin. */
export const chavesFreteExterno = {
  todas: ["logistica", "frete-externo"] as const,
  cadeiaCategoria: (categoriaId: string | null) =>
    [...chavesFreteExterno.todas, "cadeia-categoria", categoriaId] as const,
};

/** Entrega Própria herdada por categoria (Admin de Categoria e de Produto). */
export const chavesEntregaPropriaCategoria = {
  todas: ["logistica", "entrega-propria-categoria"] as const,
  cadeia: (categoriaId: string | null) =>
    [...chavesEntregaPropriaCategoria.todas, "cadeia", categoriaId] as const,
};
