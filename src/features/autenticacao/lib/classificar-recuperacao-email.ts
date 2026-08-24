export type PublicoRecuperacaoEmail = "admin" | "cliente" | null;

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
    const destino = new URL(callback);
    if (destino.origin !== new URL(origemPermitida).origin) return null;
    if (destino.pathname === "/admin/redefinir-senha")
      return administrador ? "admin" : null;
    if (destino.pathname === "/authentication/recuperar/redefinir")
      return !administrador && !emailTecnico ? "cliente" : null;
    return null;
  } catch {
    return null;
  }
}
