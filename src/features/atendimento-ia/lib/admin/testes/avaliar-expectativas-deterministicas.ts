export function avaliarExpectativasDeterministicas(criterios: string[]) {
  return {
    validas:
      criterios.length > 0 &&
      criterios.every((criterio) => criterio.trim().length >= 2),
    respostaExataObrigatoria: false as const,
  };
}
