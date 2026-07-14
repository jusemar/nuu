import { PaginaPublicacaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { listarRascunhosPublicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

export default async function PublicacaoLaquilaPage() {
  const [rascunhos, sessao] = await Promise.all([
    listarRascunhosPublicacaoLaquila(),
    buscarSessaoFornecedoresAdmin(),
  ]);

  return (
    <PaginaPublicacaoLaquilaAdmin
      rascunhosIniciais={rascunhos}
      sessaoAtiva={Boolean(sessao?.user)}
    />
  );
}
