export function limparSomenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function normalizarTextoObrigatorio(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

export function normalizarEstadoUf(valor: string) {
  return valor.trim().toUpperCase();
}

export function normalizarDataNascimento(valor?: string | null) {
  if (!valor) return null;

  const data = new Date(`${valor}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}
