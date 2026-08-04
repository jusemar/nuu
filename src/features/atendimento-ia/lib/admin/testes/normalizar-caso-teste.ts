export function normalizarCasoTeste<T extends Record<string, unknown>>(
  dados: T,
): T {
  return JSON.parse(
    JSON.stringify(dados, (_chave, valor) =>
      typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : valor,
    ),
  ) as T;
}
