import { PaginaIntegracaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import {
  buscarConfiguracaoLaquilaAdmin,
  listarExecucoesRecentesLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const [configuracao, execucoesRecentes] = await Promise.all([
    buscarConfiguracaoLaquilaAdmin(),
    listarExecucoesRecentesLaquila(),
  ]);

  return (
    <PaginaIntegracaoLaquilaAdmin
      configuracao={configuracao}
      execucoesRecentes={execucoesRecentes}
    />
  );
}
