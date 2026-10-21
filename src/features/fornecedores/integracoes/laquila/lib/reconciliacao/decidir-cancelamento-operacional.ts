type GrupoPedido = {
  chaveGrupo: string;
  origemExpedicao: string;
  fornecedorProvedor: string | null;
  itens: Array<{
    produtoId: string;
    varianteId: string | null;
    quantidade: number;
  }>;
};

/** Um cancelamento de grupo nunca cancela itens da loja ou de outro fornecedor. */
export function podeCancelarPedidoPorFornecedor({
  status,
  grupos,
  itens,
  gruposCancelados,
}: {
  status: string;
  grupos: readonly GrupoPedido[];
  itens: ReadonlyArray<{
    produtoId: string;
    varianteId: string | null;
    quantidade: number;
  }>;
  gruposCancelados: ReadonlySet<string>;
}) {
  if (
    !["pending", "paid", "processing"].includes(status) ||
    !grupos.length ||
    !itens.length
  )
    return false;
  const quantidades = new Map<string, number>();
  for (const grupo of grupos) {
    if (
      grupo.origemExpedicao !== "fornecedor" ||
      grupo.fornecedorProvedor !== "laquila" ||
      !gruposCancelados.has(grupo.chaveGrupo)
    )
      return false;
    for (const item of grupo.itens) {
      const chave = `${item.produtoId}:${item.varianteId ?? ""}`;
      quantidades.set(chave, (quantidades.get(chave) ?? 0) + item.quantidade);
    }
  }
  const persistidas = new Map<string, number>();
  for (const item of itens) {
    const chave = `${item.produtoId}:${item.varianteId ?? ""}`;
    persistidas.set(chave, (persistidas.get(chave) ?? 0) + item.quantidade);
  }
  return (
    persistidas.size === quantidades.size &&
    [...persistidas].every(
      ([chave, quantidade]) => quantidades.get(chave) === quantidade,
    )
  );
}
