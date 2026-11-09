import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { ErroAutorizacaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/erros-autorizacao-admin";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export default async function LayoutFornecedoresAdmin({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await exigirPermissaoAdmin(PERMISSOES_ADMIN.FORNECEDORES.VISUALIZAR);
  } catch (erro) {
    // Uma negativa de permissão não deve aparecer como falha inesperada do servidor.
    if (erro instanceof ErroAutorizacaoAdmin)
      return (
        <main className="p-6">
          <h1 className="text-xl font-semibold">Área restrita</h1>
          <p role="alert">Sua conta não tem acesso à gestão de fornecedores.</p>
        </main>
      );
    throw erro;
  }
  return children;
}
