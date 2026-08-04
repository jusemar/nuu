export function podeAprovarVersaoAtendimentoIa({
  autorId,
  quantidadeOutrosAprovadoresAtivos,
  usuarioId,
  podeRevisar,
}: {
  autorId: string;
  quantidadeOutrosAprovadoresAtivos: number;
  usuarioId: string;
  podeRevisar: boolean;
}) {
  if (!podeRevisar) return false;
  if (autorId !== usuarioId) return true;
  return quantidadeOutrosAprovadoresAtivos === 0;
}

/** A contagem é injetada por uma consulta server-only; nada vem do cliente. */
export async function resolverPoliticaAprovacaoAtendimentoIaNoServidor({
  autorId,
  contarOutrosAprovadoresAtivos,
  usuarioId,
  podeRevisar,
}: {
  autorId: string;
  contarOutrosAprovadoresAtivos: (usuarioId: string) => Promise<number>;
  usuarioId: string;
  podeRevisar: boolean;
}) {
  const quantidadeOutrosAprovadoresAtivos =
    autorId === usuarioId ? await contarOutrosAprovadoresAtivos(usuarioId) : 0;
  return podeAprovarVersaoAtendimentoIa({
    autorId,
    quantidadeOutrosAprovadoresAtivos,
    usuarioId,
    podeRevisar,
  });
}
