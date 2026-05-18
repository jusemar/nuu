import { PaginaMinhaConta } from "@/features/autenticacao/components/store/minha-conta/pagina-minha-conta";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";

export default async function MinhaContaPage() {
  const { sessao, cadastro } = await protegerFluxoCadastroCliente();

  return <PaginaMinhaConta cadastro={cadastro} sessao={sessao} />;
}
