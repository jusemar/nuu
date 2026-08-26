export type PublicoRecuperacaoEmail = "admin" | "cliente" | null;

/**
 * Converte a URL configurada em uma origem canônica, sem caminho ou barra final.
 * O Better Auth compara redirects absolutos com `URL.origin`; manter o mesmo
 * formato evita rejeições causadas apenas por diferenças textuais.
 */
export function normalizarOrigemAutenticacao(valor: string) {
  const url = new URL(valor.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Origem de autenticação deve usar HTTP ou HTTPS.");
  }
  return url.origin;
}

export function classificarRecuperacaoEmail({
  urlRedefinicao,
  origemPermitida,
  administrador,
  emailTecnico,
}: {
  urlRedefinicao: string;
  origemPermitida: string;
  administrador: boolean;
  emailTecnico: boolean;
}): PublicoRecuperacaoEmail {
  try {
    const callback = new URL(urlRedefinicao).searchParams.get("callbackURL");
    if (!callback) return null;
    const origem = normalizarOrigemAutenticacao(origemPermitida);
    // O Better Auth aceita redirects relativos seguros; resolvemos contra a
    // origem oficial antes de classificar o público do template.
    const destino = new URL(callback, origem);
    if (destino.origin !== origem) return null;
    if (destino.pathname === "/admin/redefinir-senha")
      return administrador ? "admin" : null;
    if (destino.pathname === "/authentication/recuperar/redefinir")
      return !administrador && !emailTecnico ? "cliente" : null;
    return null;
  } catch {
    return null;
  }
}
