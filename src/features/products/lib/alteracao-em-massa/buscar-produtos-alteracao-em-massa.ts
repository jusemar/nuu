import type { ProdutoAlteracaoEmMassa } from "../../types/alteracao-em-massa.types";

/**
 * Normaliza textos da busca de forma estável para nome e SKU: caixa,
 * acentuação e qualquer quantidade de espaços deixam de afetar o resultado.
 */
export function normalizarTextoBuscaProduto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Usa AND entre os termos. Cada termo pode estar parcialmente no nome ou no
 * SKU; não é necessário que a entrada exista como uma frase contínua.
 */
export function produtoCorrespondeBuscaAlteracaoEmMassa(
  produto: Pick<ProdutoAlteracaoEmMassa, "nome" | "sku">,
  busca: string,
) {
  const termos = normalizarTextoBuscaProduto(busca).split(" ").filter(Boolean);
  if (termos.length === 0) return true;

  const conjuntoPesquisavel = normalizarTextoBuscaProduto(
    `${produto.nome} ${produto.sku}`,
  );
  return termos.every((termo) => conjuntoPesquisavel.includes(termo));
}
