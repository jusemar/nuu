import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/header";
import { montarUrlLoginAdmin } from "@/features/autenticacao/lib/normalizar-redirecionamento-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";
import { AdminSidebar } from "@/features/admin/layout/components/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const caminho = (await headers()).get("x-caminho-admin") ?? "/admin";

  // A rota de login pertence ao namespace /admin, mas não usa o chrome do painel.
  if (caminho === "/admin/login") return children;

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader usuario={acesso.sessao.user} />
        <main className="flex-1 p-4 md:p-6 lg:pl-0">{children}</main>
      </div>
    </div>
  );
}
