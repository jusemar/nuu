const ROTA_PADRAO_ADMIN = "/admin";

export function normalizarRedirecionamentoAdmin(destino: unknown) {
  if (typeof destino !== "string") return ROTA_PADRAO_ADMIN;

  const caminho = destino.trim();
  const ehRotaAdminSegura =
    caminho.startsWith("/admin") &&
    !caminho.startsWith("//") &&
    !caminho.startsWith("/admin/login");

  return ehRotaAdminSegura ? caminho : ROTA_PADRAO_ADMIN;
}

export function montarUrlLoginAdmin(destino: unknown, erro?: string) {
  const parametros = new URLSearchParams({
    redirect: normalizarRedirecionamentoAdmin(destino),
  });

  if (erro) parametros.set("erro", erro);

  return `/admin/login?${parametros.toString()}`;
}
