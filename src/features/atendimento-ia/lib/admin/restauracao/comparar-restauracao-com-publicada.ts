export function compararRestauracaoComPublicada(entrada: {
  hashHistorico: string;
  hashPublicado: string | null;
  numeroHistorico: number;
  numeroPublicado: number | null;
}) {
  return {
    conteudoIdentico: entrada.hashPublicado === entrada.hashHistorico,
    hashHistorico: entrada.hashHistorico,
    hashPublicado: entrada.hashPublicado,
    numeroHistorico: entrada.numeroHistorico,
    numeroPublicado: entrada.numeroPublicado,
  };
}
