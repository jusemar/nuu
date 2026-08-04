export function compararVersoesConhecimento(
  anterior: string,
  candidata: string,
) {
  return {
    alterado: anterior !== candidata,
    caracteresAnteriores: anterior.length,
    caracteresCandidatos: candidata.length,
  };
}
