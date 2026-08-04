export function normalizarConfiguracaoComportamento<T>(configuracao: T): T {
  return JSON.parse(JSON.stringify(configuracao)) as T;
}
