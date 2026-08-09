import { notFound } from "next/navigation";

import { publicarProdutosImportacaoFornecedor } from "@/features/fornecedores/actions/publicar-produtos-importacao-fornecedor";
import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { origemDaImportacaoFornecedor } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { buscarImportacaoFornecedorAdmin } from "@/features/fornecedores/queries/buscar-importacao-fornecedor-admin";
import { listarRascunhosPublicacaoImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-publicacao-importacao-fornecedor";

type PublicacaoImportacaoFornecedorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicacaoImportacaoFornecedorPage({
  params,
}: PublicacaoImportacaoFornecedorPageProps) {
  const { id } = await params;
  // A importação e a sessão não dependem uma da outra; a origem sai da própria
  // importação, então os rascunhos não precisam de consulta extra para
  // descobri-la.
  const [importacao, sessao] = await Promise.all([
    buscarImportacaoFornecedorAdmin(id),
    buscarSessaoFornecedoresAdmin(),
  ]);

  if (!importacao) notFound();

  const rascunhos = await listarRascunhosPublicacaoImportacaoFornecedor(
    id,
    origemDaImportacaoFornecedor(importacao),
  );

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
