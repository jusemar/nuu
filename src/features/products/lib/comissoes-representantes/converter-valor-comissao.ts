/** Entrada decimal de até duas casas vira centavos/pontos-base sem multiplicação float. */
export function converterValorComissao(texto: string) {
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(texto))
    throw new Error("Informe um valor válido com até duas casas decimais.");
  const [inteiro, fracao = ""] = texto.split(/[,.]/);
  const valor = BigInt(inteiro) * BigInt(100) + BigInt(fracao.padEnd(2, "0"));
  if (valor > BigInt(2147483647))
    throw new Error("Valor excede o limite da configuração.");
  return Number(valor);
}
