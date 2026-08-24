const DESTINO_PADRAO = "/minha-conta";

export function normalizarDestinoAutenticacao(destino?: string | null) {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//"))
    return DESTINO_PADRAO;
  try {
    const url = new URL(destino, "https://nuu.local");
    if (
      url.origin !== "https://nuu.local" ||
      url.pathname === "/authentication"
    )
      return DESTINO_PADRAO;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DESTINO_PADRAO;
  }
}

export function criarDestinoPosAutenticacao(destino?: string | null) {
  const seguro = normalizarDestinoAutenticacao(destino);
  return `/completar-cadastro?destino=${encodeURIComponent(seguro)}`;
}
