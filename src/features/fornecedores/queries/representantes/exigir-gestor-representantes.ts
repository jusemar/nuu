import "server-only";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

/** Nesta fundação somente o principal pode conceder/revogar escopos. */
export async function exigirGestorRepresentantes() {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
  );
  if (!contexto.administradorPrincipal)
    throw new Error("GESTAO_REPRESENTANTES_NEGADA");
  return contexto;
}
