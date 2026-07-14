import { PaginaConciliacaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarRascunhosConciliacaoLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { listarOpcoesMapeamentoFornecedor } from "@/features/fornecedores/queries/listar-opcoes-mapeamento-fornecedor";

export default async function ConciliacaoLaquilaPage() {
  const [rascunhos, sessao, opcoesLoja] = await Promise.all([
    listarRascunhosConciliacaoLaquila(),
    buscarSessaoFornecedoresAdmin(),
    listarOpcoesMapeamentoFornecedor(),
  ]);

  return (
    <PaginaConciliacaoLaquilaAdmin
      rascunhosIniciais={rascunhos}
      sessaoAtiva={Boolean(sessao?.user)}
      categoriasLoja={opcoesLoja.categoriasLoja}
      marcasLoja={opcoesLoja.marcasLoja}
    />
  );
}
