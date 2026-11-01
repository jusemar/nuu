/** Contrato público documentado no Jaaa: somente /@usuario, sem contexto na URL. */
export const ORIGEM_PUBLICA_JAAA = "https://jaaa.com.br";

/** Mesma normalização do contrato de referência do Jaaa; não recebe URL livre. */
export function normalizarIdentidadeJaaa(entrada: string) {
  const identidade = entrada
    .trim()
    .replace(/^@/, "")
    .normalize("NFKC")
    .toLowerCase();
  return /^[a-z][a-z0-9_]{2,29}$/.test(identidade) ? identidade : null;
}

/** A origem é controlada pela aplicação; nenhum parâmetro ou ID privado é transmitido. */
export function criarEnderecoPublicoJaaa(entrada: string): string | null {
  const identidade = normalizarIdentidadeJaaa(entrada);
  return identidade ? `${ORIGEM_PUBLICA_JAAA}/@${identidade}` : null;
}
