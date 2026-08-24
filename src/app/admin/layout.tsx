import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/features/admin/layout/components/sidebar";
import {
  CATALOGO_PERMISSOES_ADMIN,
  PERMISSOES_ADMIN,
} from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import {
  exigirPermissaoAdmin,
  obterContextoAdministrativo,
} from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { montarUrlLoginAdmin } from "@/features/autenticacao/lib/normalizar-redirecionamento-admin";
import { rotaAdminEhPublica } from "@/features/autenticacao/lib/rotas-publicas-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const caminho = (await headers()).get("x-caminho-admin") ?? "/admin";

  // Rotas públicas de autenticação não usam o chrome nem exigem sessão do painel.
  if (rotaAdminEhPublica(caminho)) return children;

  const acesso = await buscarSessaoAdmin();

  if (!acesso.sessao?.user) {
    redirect(
      montarUrlLoginAdmin(
        caminho,
        acesso.motivo === "indisponivel"
          ? "sessao_indisponivel"
          : "sessao_expirada",
      ),
    );
  }

  if (!acesso.autorizado) {
    redirect(montarUrlLoginAdmin(caminho, "sem_permissao"));
  }

  if (caminho === "/admin") {
    await exigirPermissaoAdmin(PERMISSOES_ADMIN.PAINEL.VISUALIZAR);
  }
  const contexto = await obterContextoAdministrativo();
  const permissoesMenu = CATALOGO_PERMISSOES_ADMIN.filter(({ chave }) =>
    podeAdmin(contexto, chave),
  ).map(({ chave }) => chave);

  return (
    <div className="painel-admin bg-background flex min-h-dvh">
      <AdminSidebar permissoes={permissoesMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader usuario={acesso.sessao.user} />
        <main className="mx-auto w-full max-w-[120rem] flex-1 overflow-x-clip p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
