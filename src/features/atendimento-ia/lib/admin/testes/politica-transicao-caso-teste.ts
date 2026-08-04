const TRANSICOES = {
  rascunho: ["em_revisao", "desativado"],
  em_revisao: ["aprovado", "rascunho", "desativado"],
  aprovado: ["desativado"],
  desativado: [],
} as const;
export function podeTransicionarCasoTeste(
  origem: keyof typeof TRANSICOES,
  destino: string,
) {
  return (TRANSICOES[origem] as readonly string[]).includes(destino);
}
