import { adaptarPrecoEntregaPropriaParaHierarquia } from "./adaptar-preco-entrega-propria";
import type { PrecoProdutoParaCalculo } from "./calcular-oferta-entrega-propria";
import {
  type IdentificadoresGeograficosEntregaPropria,
  resolverRegistroGeograficoEntregaPropria,
} from "./resolver-hierarquia-entrega-propria";

/** De onde vêm as condições comerciais aplicadas ao endereço. */
export type FonteComercialEntregaPropria =
  | { tipo: "produto" }
  | { tipo: "categoria"; categoriaId: string; categoriaNome: string }
  | { tipo: "categoria-ancestral"; categoriaId: string; categoriaNome: string };

type PrecoComStatus = PrecoProdutoParaCalculo & { isActive?: boolean };

function temPrecoAplicavel(
  precos: readonly PrecoComStatus[],
  ids: IdentificadoresGeograficosEntregaPropria,
) {
  return (
    resolverRegistroGeograficoEntregaPropria(
      precos
        .filter((preco) => preco.isActive !== false)
        .map(adaptarPrecoEntregaPropriaParaHierarquia),
      ids,
    ) !== null
  );
}

/**
 * Escolhe UMA fonte comercial para o endereço, sem misturar valores:
 *
 *   Produto > Categoria direta > Categoria ancestral mais próxima
 *
 * Uma fonte é escolhida quando possui ao menos um preço ATIVO aplicável à
 * geografia (CEP, Bairro, Região ou Cidade). Dentro da fonte escolhida, o
 * cálculo aplica CEP > Bairro > Região > Cidade.
 */
export function escolherFonteComercialEntregaPropria<P extends PrecoComStatus>({
  ids,
  precosProduto,
  cadeiaCategorias,
  precosPorCategoriaId,
}: {
  ids: IdentificadoresGeograficosEntregaPropria;
  precosProduto: readonly P[];
  /** Da categoria do produto (índice 0) até a raiz. */
  cadeiaCategorias: readonly { id: string; nome: string }[];
  precosPorCategoriaId: ReadonlyMap<string, readonly P[]>;
}): { fonte: FonteComercialEntregaPropria; precos: P[] } | null {
  const ativos = (precos: readonly P[]) =>
    precos.filter((preco) => preco.isActive !== false);

  if (temPrecoAplicavel(precosProduto, ids)) {
    return { fonte: { tipo: "produto" }, precos: ativos(precosProduto) };
  }

  for (const [indice, categoria] of cadeiaCategorias.entries()) {
    const precos = precosPorCategoriaId.get(categoria.id) ?? [];
    if (temPrecoAplicavel(precos, ids)) {
      return {
        fonte: {
          tipo: indice === 0 ? "categoria" : "categoria-ancestral",
          categoriaId: categoria.id,
          categoriaNome: categoria.nome,
        },
        precos: ativos(precos),
      };
    }
  }

  return null;
}
