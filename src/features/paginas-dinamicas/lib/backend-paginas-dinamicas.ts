import "server-only";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function exigirAdministradorPaginasDinamicas() {
  return exigirPermissaoAdmin(PERMISSOES_ADMIN.PAGINAS.ADMINISTRAR);
}

export function ehViolacaoUnicidade(erro: unknown) {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    erro.code === "23505"
  );
}
