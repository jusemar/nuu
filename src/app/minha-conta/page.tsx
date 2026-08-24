import { PaginaMinhaConta } from "@/features/autenticacao/components/store/minha-conta/pagina-minha-conta";
import { buscarAcessoSegurancaCliente } from "@/features/autenticacao/queries/acesso-seguranca/buscar-acesso-seguranca-cliente";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";

export default async function MinhaContaPage() {
  const { sessao, cadastro } = await protegerFluxoCadastroCliente();
  const acesso = await buscarAcessoSegurancaCliente(sessao.usuario.id);

  return (
    <PaginaMinhaConta acesso={acesso} cadastro={cadastro} sessao={sessao} />
  );
}
