import "server-only";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoNoContexto } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
/** Autoriza somente a identidade da sessão; nunca recebe ID do representante do cliente. */
export async function exigirRepresentanteJaaa() {
  const c = await obterContextoAdministrativo();
  if (
    c.situacao !== "ativo" ||
    !c.representanteFornecedor ||
    c.administradorPrincipal
  )
    throw new Error("Acesso indisponível.");
  exigirPermissaoNoContexto(
    c,
    PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR,
  );
  return c;
}
