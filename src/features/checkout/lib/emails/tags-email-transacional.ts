import "server-only";

export function normalizarValorTagEmailTransacional(valor: string) {
  const valorNormalizado = valor
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return valorNormalizado || "sem_valor";
}
