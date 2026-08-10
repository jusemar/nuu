/**
 * Normaliza o valor informado no formulário para o estoque da variante técnica
 * de um produto simples. A fonte de verdade continua sendo
 * `product_variant.stock_quantity`; este helper apenas protege a entrada.
 */
export function normalizarEstoqueProdutoSimples(valor: unknown) {
  if (typeof valor === "string" && !valor.trim()) return null;

  const numero = typeof valor === "number" ? valor : Number(valor);

  if (!Number.isSafeInteger(numero) || numero < 0) return null;

  return numero;
}
