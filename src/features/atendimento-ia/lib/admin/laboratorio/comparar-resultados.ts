export function compararResultados(dados: {
  respostaPublicada: string;
  respostaCandidata: string;
  criterios: string[];
  conflitos?: string[];
  fontesAusentes?: string[];
  violacoes?: string[];
}) {
  const bloqueado = Boolean(dados.violacoes?.length);
  const inconclusivo = Boolean(
    dados.fontesAusentes?.length || dados.conflitos?.length,
  );
  return {
    resultadoAutomatico: bloqueado
      ? ("bloqueado" as const)
      : inconclusivo
        ? ("inconclusivo" as const)
        : dados.respostaCandidata.trim()
          ? ("aprovado" as const)
          : ("reprovado" as const),
    ...dados,
  };
}
