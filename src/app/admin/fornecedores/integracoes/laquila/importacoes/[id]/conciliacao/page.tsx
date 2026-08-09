import { notFound } from "next/navigation";

import { PaginaConciliacaoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarOpcoesMapeamentoFornecedor } from "@/features/fornecedores/queries/listar-opcoes-mapeamento-fornecedor";
import { listarRascunhosImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-importacao-fornecedor";

type ConciliacaoImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({
  params,
}: ConciliacaoImportacaoLaquilaPageProps) {
  const { id } = await params;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  // A query é a MESMA do fluxo por arquivo: ela descobre a origem pela própria
  // importação e já aplica a fila ativa (publicado e ignorado ficam de fora).
  const [rascunhos, sessao, opcoesLoja] = await Promise.all([
    listarRascunhosImportacaoFornecedor(importacao.id),
    buscarSessaoFornecedoresAdmin(),
    listarOpcoesMapeamentoFornecedor(),
  ]);

  return (
    <PaginaConciliacaoLaquilaAdmin
      importacaoId={importacao.id}
      fornecedor={importacao.nomeFornecedor}
      rascunhos={rascunhos}
      sessaoAtiva={Boolean(sessao?.user)}
      categoriasLoja={opcoesLoja.categoriasLoja}
      marcasLoja={opcoesLoja.marcasLoja}
    />
  );
}
