import { ConfirmacaoEmailCliente } from "@/features/autenticacao/components/store/minha-conta/confirmacao-email-cliente";
import { buscarAcessoSegurancaCliente } from "@/features/autenticacao/queries/acesso-seguranca/buscar-acesso-seguranca-cliente";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: tokenParametro } = await searchParams;
  const token = tokenParametro?.trim() || null;
  const destino = `/minha-conta/confirmar-email${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const { sessao } = await protegerFluxoCadastroCliente({
    destinoLogin: `/authentication?destino=${encodeURIComponent(destino)}`,
  });
  const acesso = await buscarAcessoSegurancaCliente(sessao.usuario.id);
  return (
    <ConfirmacaoEmailCliente
      token={token}
      acesso={acesso}
      sessaoRecenteInicial={
        Date.now() - sessao.criadoEm.getTime() <= 15 * 60 * 1_000
      }
    />
  );
}
