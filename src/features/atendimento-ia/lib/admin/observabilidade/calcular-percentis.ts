export function calcularPercentis(valores: number[]) {
  const ordenados = valores.filter(Number.isFinite).toSorted((a, b) => a - b);
  const percentil = (p: number) => {
    if (!ordenados.length) return null;
    const indice = Math.ceil((p / 100) * ordenados.length) - 1;
    return ordenados[Math.max(0, indice)] ?? null;
  };
  return {
    quantidade: ordenados.length,
    p50: ordenados.length >= 2 ? percentil(50) : null,
    p95: ordenados.length >= 20 ? percentil(95) : null,
    p99: ordenados.length >= 100 ? percentil(99) : null,
  };
}
