import { redirect } from "next/navigation";

import { FormularioAlterarSenhaMinhaContaAdmin } from "@/features/autenticacao/components/admin/formulario-alterar-senha-minha-conta-admin";
import { FormularioDadosMinhaContaAdmin } from "@/features/autenticacao/components/admin/formulario-dados-minha-conta-admin";
import { buscarMinhaContaAdmin } from "@/features/autenticacao/queries/perfil-admin/buscar-minha-conta-admin";

export default async function MinhaContaAdminPage() {
  const conta = await buscarMinhaContaAdmin();

  if (!conta) redirect("/admin/login?erro=sessao_expirada");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Minha conta
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie seus dados de acesso ao painel administrativo.
        </p>
      </header>

      <FormularioDadosMinhaContaAdmin dadosIniciais={conta} />
      <FormularioAlterarSenhaMinhaContaAdmin />
    </div>
  );
}
