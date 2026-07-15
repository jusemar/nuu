import { notFound } from "next/navigation";

import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { publicarProdutosImportacaoFornecedor } from "@/features/fornecedores/actions/publicar-produtos-importacao-fornecedor";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarImportacoesFornecedoresAdmin } from "@/features/fornecedores/queries/listar-importacoes-fornecedores-admin";
import { listarRascunhosPublicacaoImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-publicacao-importacao-fornecedor";

type PublicacaoImportacaoFornecedorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicacaoImportacaoFornecedorPage({
  params,
}: PublicacaoImportacaoFornecedorPageProps) {
  const { id } = await params;
  const [importacoes, rascunhos, sessao] = await Promise.all([
    listarImportacoesFornecedoresAdmin(),
    listarRascunhosPublicacaoImportacaoFornecedor(id),
    buscarSessaoFornecedoresAdmin(),
  ]);
  const importacao = importacoes.find((item) => item.id === id);

  if (!importacao) notFound();

  return (
    <PaginaPublicacaoFornecedorAdmin
      titulo="Publicação da importação"
      subtitulo={`Revise e confirme os produtos de ${importacao.nomeFornecedor} que entrarão no catálogo da loja.`}
      hrefVoltar={`/admin/fornecedores/importacoes/${id}?etapa=revisao`}
      rascunhosIniciais={rascunhos}
      sessaoAtiva={Boolean(sessao?.user)}
      acaoPublicar={publicarProdutosImportacaoFornecedor.bind(null, id)}
    />
  );
}
