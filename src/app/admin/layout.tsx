import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/features/admin/layout/components/sidebar";
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

  return (
    <div className="bg-background flex min-h-dvh">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader usuario={acesso.sessao.user} />
        <main className="mx-auto w-full max-w-[120rem] flex-1 overflow-x-clip p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
