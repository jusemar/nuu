export function calcularResumoVendaCruzada<
  Produto extends { id: string; precoEmCentavos: number },
>({
  precoPrincipalEmCentavos,
  quantidadePrincipal,
  produtos,
  idsSelecionados,
}: {
  precoPrincipalEmCentavos: number | null;
  quantidadePrincipal: number;
  produtos: Produto[];
  idsSelecionados: ReadonlySet<string>;
}) {
  const adicionais = produtos.filter((produto) =>
    idsSelecionados.has(produto.id),
  );
  const totalAdicionais = adicionais.reduce(
    (total, produto) => total + produto.precoEmCentavos,
    0,
  );
  return {
    quantidadeProdutos: 1 + adicionais.length,
    quantidadeAdicionais: adicionais.length,
    totalEmCentavos:
      precoPrincipalEmCentavos === null
        ? null
        : precoPrincipalEmCentavos * quantidadePrincipal + totalAdicionais,
  };
}

/** Alterna uma seleção sem modificar o Set recebido pelo React. */
export function alternarSelecaoVendaCruzada(
  idsSelecionados: ReadonlySet<string>,
  produtoId: string,
  produtoDisponivel: boolean,
) {
  if (!produtoDisponivel) return new Set(idsSelecionados);

  const proximosIds = new Set(idsSelecionados);
  if (proximosIds.has(produtoId)) proximosIds.delete(produtoId);
  else proximosIds.add(produtoId);
  return proximosIds;
}

export function montarTextoUnidadesVendaCruzada(
  quantidadePrincipal: number,
  quantidadeAdicionais: number,
) {
  const unidadePrincipal =
    quantidadePrincipal === 1 ? "1 unidade" : `${quantidadePrincipal} unidades`;
  const textoPrincipal = `Produto principal: ${unidadePrincipal}.`;

  return quantidadeAdicionais === 0
    ? textoPrincipal
    : `${textoPrincipal} Adicionais selecionados: 1 unidade de cada.`;
}

export function podeAdicionarVendaCruzada(
  principalDisponivel: boolean,
  quantidadeAdicionais: number,
) {
  return principalDisponivel && quantidadeAdicionais > 0;
}
