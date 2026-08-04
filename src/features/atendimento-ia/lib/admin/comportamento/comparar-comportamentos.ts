export function compararComportamentos(a: unknown, b: unknown) {
  const anterior = JSON.stringify(a);
  const candidata = JSON.stringify(b);
  return {
    alterado: anterior !== candidata,
    caracteresAnteriores: anterior.length,
    caracteresCandidatos: candidata.length,
  };
}
