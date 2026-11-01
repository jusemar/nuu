import "server-only";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoNoContexto } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";
/** Reutiliza a entrada RBAC da área restrita; não libera pedidos ou finanças globais. */
export async function obterAcessoPainelComissoes() {
  const c = await obterContextoAdministrativo();
  if (c.situacao !== "ativo") throw new Error("Acesso indisponível.");
  if (c.administradorPrincipal) {
    await exigirGestorRepresentantes();
    return {
      gestor: true,
      userId: c.userId,
      administradorId: c.administradorId,
    };
  }
  if (!c.representanteFornecedor) throw new Error("Acesso indisponível.");
  exigirPermissaoNoContexto(
    c,
    PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR,
  );
  return {
    gestor: false,
    userId: c.userId,
    administradorId: c.administradorId,
  };
}
