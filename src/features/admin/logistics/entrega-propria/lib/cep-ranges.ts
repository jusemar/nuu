export type CepRangeInput = {
  cepStart: string;
  cepEnd: string;
};

export function gerarFaixasContiguasDeCeps(ceps: string[]): CepRangeInput[] {
  const numeros = Array.from(
    new Set(
      ceps
        .map((cep) => cep.replace(/\D/g, ""))
        .filter((cep) => cep.length === 8)
        .map((cep) => Number(cep)),
    ),
  ).sort((a, b) => a - b);

  if (numeros.length === 0) {
    return [];
  }

  const ranges: CepRangeInput[] = [];
  let start = numeros[0];
  let previous = numeros[0];

  for (const current of numeros.slice(1)) {
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push({
      cepStart: String(start).padStart(8, "0"),
      cepEnd: String(previous).padStart(8, "0"),
    });
    start = current;
    previous = current;
  }

  ranges.push({
    cepStart: String(start).padStart(8, "0"),
    cepEnd: String(previous).padStart(8, "0"),
  });

  return ranges;
}
