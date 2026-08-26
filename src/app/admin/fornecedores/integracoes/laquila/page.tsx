import { PaginaIntegracaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { obterAmbienteAplicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/ambiente-laquila";
import {
  buscarConfiguracaoLaquilaAdmin,
  listarExecucoesRecentesLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const ambiente = obterAmbienteAplicacaoLaquila();
  const [configuracao, execucoesRecentes] = await Promise.all([
    buscarConfiguracaoLaquilaAdmin({ ambiente }),
    listarExecucoesRecentesLaquila(ambiente),
  ]);

  return (
    <PaginaIntegracaoLaquilaAdmin
      configuracao={configuracao}
      execucoesRecentes={execucoesRecentes}
      ambiente={ambiente}
    />
  );
}
