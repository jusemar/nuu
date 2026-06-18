import { PaginaIntegracaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarConfiguracaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const configuracao = await buscarConfiguracaoLaquilaAdmin();

  return <PaginaIntegracaoLaquilaAdmin configuracao={configuracao} />;
}
