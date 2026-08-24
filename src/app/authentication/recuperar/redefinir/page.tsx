import { PaginaRedefinirSenhaCliente } from "@/features/autenticacao/components/store/recuperacao/pagina-redefinir-senha-cliente";

export default async function RedefinirSenhaClientePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const parametros = await searchParams;
  return (
    <PaginaRedefinirSenhaCliente
      token={parametros.token?.trim() || null}
      tokenInvalido={parametros.error === "INVALID_TOKEN"}
    />
  );
}
