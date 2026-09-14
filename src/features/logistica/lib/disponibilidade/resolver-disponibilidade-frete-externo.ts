import {
  PADRAO_LOJA_FRETE_EXTERNO,
  PROVEDORES_FORA_DO_FRETE_EXTERNO,
} from "../../constants/frete-externo";
import type { OpcaoFrete } from "../../types/contratos-frete";
import type {
  CategoriaCadeiaFreteExterno,
  DisponibilidadeFreteExterno,
  ModoDisponibilidadeFreteExterno,
} from "../../types/disponibilidade-frete-externo";
import {
  descreverOrigemModoHerdado,
  montarCadeiaCategorias,
  resolverModoHerdado,
} from "./resolver-modo-herdado";

/**
 * Regra única da disponibilidade do Frete Externo (Admin e loja usam esta
 * função). Precedência:
 *
 *   Produto > Categoria do produto > Categorias ancestrais > Padrão da loja
 *
 * `herdar` em qualquer nível passa a decisão para o nível seguinte.
 *
 * Importante: o valor "ativado" NÃO libera tudo. Ele só permite que o Frete
 * Externo participe; as regras logísticas existentes continuam decidindo.
 */
export function resolverDisponibilidadeFreteExterno({
  modoProduto,
  cadeiaCategorias,
}: {
  modoProduto: ModoDisponibilidadeFreteExterno;
  /** Da categoria do produto (índice 0) até a raiz. */
  cadeiaCategorias: readonly CategoriaCadeiaFreteExterno[];
}): DisponibilidadeFreteExterno {
  return resolverModoHerdado({
    modoProduto,
    cadeiaCategorias,
    padraoLoja: PADRAO_LOJA_FRETE_EXTERNO,
  });
}

/**
 * Monta a cadeia Categoria → pai → avô… a partir da lista de categorias.
 * Protege contra ciclos acidentais na hierarquia.
 */
export function montarCadeiaCategoriasFreteExterno(
  categorias: readonly {
    id: string;
    nome: string;
    parentId: string | null;
    modo: ModoDisponibilidadeFreteExterno;
  }[],
  categoriaId: string | null | undefined,
): CategoriaCadeiaFreteExterno[] {
  return montarCadeiaCategorias(categorias, categoriaId).map(
    ({ id, nome, modo }) => ({ id, nome, modo }),
  );
}

/** Opção pertence ao Frete Externo (qualquer provedor que não seja da loja). */
export function opcaoEhFreteExterno(opcao: Pick<OpcaoFrete, "provedor">) {
  return !PROVEDORES_FORA_DO_FRETE_EXTERNO.has(
    opcao.provedor.trim().toLowerCase(),
  );
}

/** Texto curto da origem, em PT-BR, para o Admin. */
export const descreverOrigemFreteExterno = descreverOrigemModoHerdado;
