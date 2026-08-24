import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export default async function LayoutAtendenteIaAdmin({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR);
  return children;
}
