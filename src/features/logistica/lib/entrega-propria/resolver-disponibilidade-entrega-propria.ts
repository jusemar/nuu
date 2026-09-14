import type { ModoDisponibilidadeEntregaPropria } from "@/db/table/logistics/entrega-propria/modo-disponibilidade-entrega-propria";

import {
  type CategoriaCadeiaModo,
  type OrigemModoHerdado,
  resolverModoHerdado,
} from "../disponibilidade/resolver-modo-herdado";

/**
 * Padrão da loja para Entrega Própria sem configuração em nenhum nível:
 * desativada. É o comportamento histórico (o produto precisava ser ligado).
 */
export const PADRAO_LOJA_ENTREGA_PROPRIA = "desativado" as const;

export type OrigemDisponibilidadeEntregaPropria =
  | OrigemModoHerdado
  | { tipo: "logistica-fornecedor" };

export type DisponibilidadeEntregaPropria = {
  ativo: boolean;
  valor: "ativado" | "desativado";
  origem: OrigemDisponibilidadeEntregaPropria;
};

/**
 * Modo explícito do produto. Produtos anteriores à herança têm `null` e
 * continuam usando o antigo "Permitir Entrega Própria" (ligado → ativado,
 * desligado → desativado), sem mudança silenciosa de comportamento.
 */
export function modoEntregaPropriaDoProduto({
  modo,
  permiteEntregaPropriaLegado,
}: {
  modo: ModoDisponibilidadeEntregaPropria | null | undefined;
  permiteEntregaPropriaLegado: boolean | null | undefined;
}): ModoDisponibilidadeEntregaPropria {
  if (modo) return modo;
  return permiteEntregaPropriaLegado ? "ativado" : "desativado";
}

/**
 * Regra única da disponibilidade da Entrega Própria (loja e Admin):
 *
 *   Produto > Categoria > Categorias ancestrais > Padrão da loja (desativado)
 *
 * Produtos expedidos por fornecedor (ex.: Laquila) NUNCA recebem Entrega
 * Própria, nem por herança de categoria.
 */
export function resolverDisponibilidadeEntregaPropria({
  modoProduto,
  cadeiaCategorias,
  expedidoPorFornecedor,
}: {
  modoProduto: ModoDisponibilidadeEntregaPropria;
  cadeiaCategorias: readonly CategoriaCadeiaModo[];
  expedidoPorFornecedor: boolean;
}): DisponibilidadeEntregaPropria {
  if (expedidoPorFornecedor) {
    return {
      ativo: false,
      valor: "desativado",
      origem: { tipo: "logistica-fornecedor" },
    };
  }

  return resolverModoHerdado({
    modoProduto,
    cadeiaCategorias,
    padraoLoja: PADRAO_LOJA_ENTREGA_PROPRIA,
  });
}
