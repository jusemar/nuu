const ROTAS_PUBLICAS_ADMIN = new Set([
  "/admin/login",
  "/admin/esqueci-senha",
  "/admin/redefinir-senha",
]);

export function rotaAdminEhPublica(caminho: string) {
  return ROTAS_PUBLICAS_ADMIN.has(caminho);
}
