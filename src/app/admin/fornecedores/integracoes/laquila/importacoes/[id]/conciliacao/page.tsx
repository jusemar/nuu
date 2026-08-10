import { notFound } from "next/navigation";

import { PaginaConciliacaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { ORIGEM_IMPORTACAO_API_LAQUILA } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarOpcoesMapeamentoFornecedor } from "@/features/fornecedores/queries/listar-opcoes-mapeamento-fornecedor";
import { listarRascunhosImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-importacao-fornecedor";

type ConciliacaoImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    pagina?: string;
    limite?: string;
    busca?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: ConciliacaoImportacaoLaquilaPageProps) {
  const { id } = await params;
  const { pagina, limite, busca } = await searchParams;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  // A query é a MESMA do fluxo por arquivo: ela descobre a origem pela própria
  // importação e já aplica a fila ativa (publicado e ignorado ficam de fora).
  const [rascunhos, sessao, opcoesLoja] = await Promise.all([
    listarRascunhosImportacaoFornecedor(
      importacao.id,
      ORIGEM_IMPORTACAO_API_LAQUILA,
      { pagina, limite, busca },
    ),
    buscarSessaoFornecedoresAdmin(),
    listarOpcoesMapeamentoFornecedor(),
  ]);

  return (
    <PaginaConciliacaoLaquilaAdmin
      importacaoId={importacao.id}
      fornecedor={importacao.nomeFornecedor}
      rascunhos={rascunhos.itens}
      paginacao={rascunhos.paginacao}
      busca={busca ?? ""}
      sessaoAtiva={Boolean(sessao?.user)}
      categoriasLoja={opcoesLoja.categoriasLoja}
      marcasLoja={opcoesLoja.marcasLoja}
    />
  );
}
