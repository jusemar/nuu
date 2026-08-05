import type { ItemAvaliacaoPagamentoNaEntrega } from "../types/pagamento-na-entrega.types";

/**
 * Decide se UM item aceita pagamento na entrega, resolvendo a herança produto → variante.
 *
 * A flag da variante tem três estados, não dois:
 *   - `null`  → não foi decidido na variante, então vale o que o produto disser;
 *   - `true`  → esta variante aceita;
 *   - `false` → esta variante NÃO aceita, mesmo que o produto aceite.
 *
 * O operador `??` (coalescência nula) é exatamente essa regra: ele só cai para o produto
 * quando o valor da variante é `null` ou `undefined`. Um `false` da variante é um valor
 * legítimo e vence — que é o comportamento seguro, porque bloquear é sempre mais barato
 * do que liberar por engano.
 *
 * Cuidado com a armadilha clássica: usar `||` aqui estaria errado, porque `false || true`
 * daria `true` e a variante bloqueada passaria a aceitar.
 *
 * É o mesmo idioma que o projeto já usa para dimensões em
 * `resolver-item-logistico.ts` (`variante.pesoEmGramas ?? produto.pesoEmGramas`).
 */
export function resolverFlagPagamentoNaEntregaItem(
  item: Pick<
    ItemAvaliacaoPagamentoNaEntrega,
    "produtoAceitaPagamentoNaEntrega" | "varianteAceitaPagamentoNaEntrega"
  >,
): boolean {
  return (
    item.varianteAceitaPagamentoNaEntrega ??
    item.produtoAceitaPagamentoNaEntrega
  );
}
