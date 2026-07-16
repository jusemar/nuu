import { PaginaRedefinirSenha } from "@/features/autenticacao/components/admin/pagina-redefinir-senha";

type RedefinirSenhaAdminPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function RedefinirSenhaAdminPage({
  searchParams,
}: RedefinirSenhaAdminPageProps) {
  const parametros = await searchParams;

  return (
    <PaginaRedefinirSenha
      token={parametros.token?.trim() || null}
      tokenInvalido={parametros.error === "INVALID_TOKEN"}
    />
  );
}
