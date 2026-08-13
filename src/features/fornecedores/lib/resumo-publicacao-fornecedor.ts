export type FalhaPublicacaoFornecedor = {
  rascunhoId: string;
  erro: string;
};

export type ResumoPublicacaoFornecedor = {
  quantidadeSolicitada: number;
  quantidadePublicada: number;
  quantidadeNaoPublicada: number;
  mensagem: string;
};

/** Monta uma única mensagem confiável para sucesso total, parcial ou falha total. */
export function resumirPublicacaoFornecedor(
  quantidadeSolicitada: number,
  quantidadePublicada: number,
): ResumoPublicacaoFornecedor {
  const quantidadeNaoPublicada = Math.max(
    0,
    quantidadeSolicitada - quantidadePublicada,
  );
  const publicados =
    quantidadePublicada === 1
      ? "1 produto publicado com sucesso."
      : `${quantidadePublicada} produtos publicados com sucesso.`;
  const pendentes =
    quantidadeNaoPublicada === 1
      ? "1 produto requer atenção."
      : `${quantidadeNaoPublicada} produtos requerem atenção.`;

  return {
    quantidadeSolicitada,
    quantidadePublicada,
    quantidadeNaoPublicada,
    mensagem:
      quantidadePublicada === 0
        ? `Nenhum produto foi publicado. Revise os ${quantidadeNaoPublicada} produtos com pendências.`
        : quantidadeNaoPublicada > 0
          ? `${publicados} ${pendentes}`
          : publicados,
  };
}
