import type { ItemCarrinho, NovoItemCarrinho } from "../types/carrinho.types";

export function criarIdItemCarrinho(
  item: Pick<
    NovoItemCarrinho,
    "produtoId" | "produtoVarianteId" | "modalidadeTipo" | "variante"
  >,
) {
  return [
    item.produtoId,
    item.produtoVarianteId?.trim(),
    item.modalidadeTipo?.trim() || item.variante?.trim() || "sem-modalidade",
  ]
    .filter(Boolean)
    .join(":");
}

/** Consolida um lote inteiro antes de persistir, sem expor estados parciais ao carrinho. */
export function adicionarItensAoCarrinho(
  itensAtuais: ItemCarrinho[],
  novosItens: NovoItemCarrinho[],
) {
  return novosItens.reduce<ItemCarrinho[]>((itensAcumulados, novoItem) => {
    const id = criarIdItemCarrinho(novoItem);
    const quantidadeAdicionada = novoItem.quantidade ?? 1;
    const itemExistente = itensAcumulados.find((item) => item.id === id);

    if (!itemExistente) {
      return [
        ...itensAcumulados,
        { ...novoItem, id, quantidade: quantidadeAdicionada },
      ];
    }

    return itensAcumulados.map((item) =>
      item.id === id
        ? {
            ...novoItem,
            id: item.id,
            quantidade: item.quantidade + quantidadeAdicionada,
          }
        : item,
    );
  }, itensAtuais);
}
