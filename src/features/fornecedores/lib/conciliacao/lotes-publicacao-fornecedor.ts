/**
 * Divisão da publicação em lotes.
 *
 * Existe por dois motivos concretos, os dois medidos:
 *
 * 1. A action recusa mais de 50 ids por chamada (`z.array().max(50)`). Mandar a
 *    seleção inteira numa requisição só fazia um lote grande morrer na
 *    validação, com a mensagem genérica "Selecione ao menos um rascunho
 *    válido" — o gestor selecionava 104 itens e não entendia o erro.
 *
 * 2. Publicar é sequencial no servidor e cada produto novo custa vários
 *    round-trips. Um lote grande vira uma requisição longa, sem sinal de vida e
 *    sujeita a timeout; se ela cair, o gestor não sabe o que entrou.
 *
 * Lotes pequenos resolvem os dois: cada requisição termina rápido, o progresso
 * anda de verdade e uma falha isola poucos itens em vez do lote inteiro.
 */

/** Até aqui vale publicar de um em um: o progresso item a item é exato. */
export const LIMITE_PUBLICACAO_ITEM_A_ITEM = 25;

/** Acima disso, agrupa — sempre com folga sobre o teto de 50 da action. */
export const TAMANHO_LOTE_PUBLICACAO_GRANDE = 5;

export function dividirLotesPublicacaoFornecedor(ids: string[]): string[][] {
  if (ids.length === 0) return [];

  const tamanho =
    ids.length <= LIMITE_PUBLICACAO_ITEM_A_ITEM
      ? 1
      : TAMANHO_LOTE_PUBLICACAO_GRANDE;

  const lotes: string[][] = [];
  for (let inicio = 0; inicio < ids.length; inicio += tamanho) {
    lotes.push(ids.slice(inicio, inicio + tamanho));
  }

  return lotes;
}
