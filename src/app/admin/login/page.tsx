import { redirect } from "next/navigation";

import { PaginaLoginAdmin } from "@/features/autenticacao/components/admin/pagina-login-admin";
import {
  montarUrlLoginAdmin,
  normalizarRedirecionamentoAdmin,
} from "@/features/autenticacao/lib/normalizar-redirecionamento-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

type LoginAdminPageProps = {
  searchParams: Promise<{ redirect?: string; erro?: string; error?: string }>;
};

export default async function LoginAdminPage({
  searchParams,
}: LoginAdminPageProps) {
  const parametros = await searchParams;
  const destino = normalizarRedirecionamentoAdmin(parametros.redirect);

  if (parametros.error) {
    redirect(montarUrlLoginAdmin(destino, "falha_autenticacao"));
  }

  const acesso = await buscarSessaoAdmin();

  if (acesso.autorizado) redirect(destino);

  const semPermissao =
    acesso.motivo === "sem_permissao" || parametros.erro === "sem_permissao";
  const sessaoExpirada = parametros.erro === "sessao_expirada";
  const erroAutenticacao = parametros.erro === "falha_autenticacao";
  const sessaoIndisponivel =
    acesso.motivo === "indisponivel" ||
    parametros.erro === "sessao_indisponivel";

  return (
    <PaginaLoginAdmin
      destino={destino}
      encerrarSessaoAtual={semPermissao}
      mensagemInicial={
        semPermissao
          ? "Esta conta não possui permissão para acessar o painel administrativo."
          : sessaoIndisponivel
            ? "Sessão administrativa indisponível. Entre novamente para continuar."
            : sessaoExpirada
              ? "Sua sessão administrativa expirou. Entre novamente para continuar."
              : erroAutenticacao
                ? "Não foi possível entrar. Verifique os dados e tente novamente."
                : null
      }
    />
  );
}
