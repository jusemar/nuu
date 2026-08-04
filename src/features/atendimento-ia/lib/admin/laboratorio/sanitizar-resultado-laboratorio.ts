export function sanitizarResultadoLaboratorio(valor: unknown) {
  const texto = valor instanceof Error ? valor.name : String(valor);
  return texto
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[REMOVIDO]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[REMOVIDO]")
    .replace(/sk-[\w-]+/g, "[REMOVIDO]")
    .slice(0, 500);
}
