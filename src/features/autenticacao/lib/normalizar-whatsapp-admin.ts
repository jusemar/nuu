const CODIGO_PAIS_BRASIL = "55";
const QUANTIDADE_DIGITOS_NACIONAL = 11;
const QUANTIDADE_DIGITOS_COMPLETA = 13;

export function normalizarWhatsappAdmin(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  const numeroCompleto =
    digitos.length === QUANTIDADE_DIGITOS_NACIONAL
      ? `${CODIGO_PAIS_BRASIL}${digitos}`
      : digitos;

  if (
    numeroCompleto.length !== QUANTIDADE_DIGITOS_COMPLETA ||
    !numeroCompleto.startsWith(CODIGO_PAIS_BRASIL)
  ) {
    return null;
  }

  const numeroNacional = numeroCompleto.slice(CODIGO_PAIS_BRASIL.length);
  const ddd = numeroNacional.slice(0, 2);

  if (ddd === "00" || numeroNacional[2] !== "9") return null;

  return numeroCompleto;
}

export function formatarWhatsappAdmin(valor: string | null | undefined) {
  if (!valor) return "";

  const normalizado = normalizarWhatsappAdmin(valor);
  if (!normalizado) return valor;

  const numero = normalizado.slice(CODIGO_PAIS_BRASIL.length);
  return `+55 (${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}
