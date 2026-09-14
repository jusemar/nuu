/**
 * Herança genérica de disponibilidade logística (Frete Externo e Entrega
 * Própria usam esta mesma regra):
 *
 *   Produto > Categoria do produto > Categorias ancestrais > Padrão da loja
 *
 * `herdar` em qualquer nível passa a decisão para o nível seguinte.
 */
export type ModoHerdavel = "herdar" | "ativado" | "desativado";

export type OrigemModoHerdado =
  | { tipo: "produto" }
  | { tipo: "categoria"; categoriaId: string; categoriaNome: string }
  | { tipo: "categoria-ancestral"; categoriaId: string; categoriaNome: string }
  | { tipo: "padrao-loja" };

export type ResultadoModoHerdado = {
  ativo: boolean;
  valor: "ativado" | "desativado";
  origem: OrigemModoHerdado;
};

/** Categoria da cadeia, da mais específica (índice 0) para a raiz. */
export type CategoriaCadeiaModo = {
  id: string;
  nome: string;
  modo: ModoHerdavel;
};

export function resolverModoHerdado({
  modoProduto,
  cadeiaCategorias,
  padraoLoja,
}: {
  modoProduto: ModoHerdavel;
  cadeiaCategorias: readonly CategoriaCadeiaModo[];
  padraoLoja: "ativado" | "desativado";
}): ResultadoModoHerdado {
  const efetivo = (
    valor: "ativado" | "desativado",
    origem: OrigemModoHerdado,
  ): ResultadoModoHerdado => ({ ativo: valor === "ativado", valor, origem });

  if (modoProduto !== "herdar") {
    return efetivo(modoProduto, { tipo: "produto" });
  }

  const indice = cadeiaCategorias.findIndex(
    (categoria) => categoria.modo !== "herdar",
  );
  if (indice >= 0) {
    const categoria = cadeiaCategorias[indice]!;
    return efetivo(categoria.modo as "ativado" | "desativado", {
      tipo: indice === 0 ? "categoria" : "categoria-ancestral",
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
    });
  }

  return efetivo(padraoLoja, { tipo: "padrao-loja" });
}

/**
 * Monta a cadeia Categoria → pai → avô… a partir da lista de categorias,
 * preservando os campos de cada uma. Protege contra ciclos acidentais.
 */
export function montarCadeiaCategorias<
  C extends { id: string; parentId: string | null },
>(categorias: readonly C[], categoriaId: string | null | undefined): C[] {
  const porId = new Map(
    categorias.map((categoria) => [categoria.id, categoria]),
  );
  const cadeia: C[] = [];
  const visitadas = new Set<string>();
  let atual = categoriaId ? porId.get(categoriaId) : undefined;

  while (atual && !visitadas.has(atual.id)) {
    visitadas.add(atual.id);
    cadeia.push(atual);
    atual = atual.parentId ? porId.get(atual.parentId) : undefined;
  }

  return cadeia;
}

/** Texto curto da origem, em PT-BR, para o Admin. */
export function descreverOrigemModoHerdado(origem: OrigemModoHerdado) {
  if (origem.tipo === "produto") return "Produto";
  if (origem.tipo === "categoria") return `Categoria ${origem.categoriaNome}`;
  if (origem.tipo === "categoria-ancestral") {
    return `Categoria ${origem.categoriaNome} (categoria superior)`;
  }
  return "Padrão da loja";
}
