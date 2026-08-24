import { PaginaUsuariosPermissoes } from "@/features/administradores/components/admin/pagina-usuarios-permissoes";
import { listarAdministradores } from "@/features/administradores/queries/listar-administradores";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export default async function UsuariosPermissoesPage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.ADMINISTRADORES.VISUALIZAR);
  const dados = await listarAdministradores();
  return <PaginaUsuariosPermissoes dados={dados} />;
}
