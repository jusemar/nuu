import "server-only";

import { redirect } from "next/navigation";

import { PERMISSOES_ADMIN } from "../../constants/permissoes-administrativas";
import {
  exigirPermissaoAdmin,
  obterContextoAdministrativo,
} from "../../lib/autorizacao-admin/servico-autorizacao-admin";

/** O destino inicial pertence à página /admin, não ao layout que persiste entre rotas. */
export async function exigirAcessoPaginaInicialAdmin() {
  const contexto = await obterContextoAdministrativo();
  if (
    contexto.situacao === "ativo" &&
    contexto.representanteFornecedor &&
    !contexto.administradorPrincipal
  ) {
    redirect("/admin/products");
  }
  // Também protege a folha ao navegar por RSC com um layout já montado.
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PAINEL.VISUALIZAR);
}
