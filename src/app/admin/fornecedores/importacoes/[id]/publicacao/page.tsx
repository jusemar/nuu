import { notFound } from "next/navigation";

import { publicarProdutosImportacaoFornecedor } from "@/features/fornecedores/actions/publicar-produtos-importacao-fornecedor";
import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { origemDaImportacaoFornecedor } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { buscarImportacaoFornecedorAdmin } from "@/features/fornecedores/queries/buscar-importacao-fornecedor-admin";
import { listarRascunhosPublicacaoImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-publicacao-importacao-fornecedor";

type PublicacaoImportacaoFornecedorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string; limite?: string }>;
};

export default async function PublicacaoImportacaoFornecedorPage({
  params,
  searchParams,
}: PublicacaoImportacaoFornecedorPageProps) {
  const { id } = await params;
  const { pagina, limite } = await searchParams;
  // A importação e a sessão não dependem uma da outra; a origem sai da própria
  // importação, então os rascunhos não precisam de consulta extra para
  // descobri-la.
  const [importacao, sessao] = await Promise.all([
    buscarImportacaoFornecedorAdmin(id),
    buscarSessaoFornecedoresAdmin(),
  ]);

  if (!importacao) notFound();

  const resultado = await listarRascunhosPublicacaoImportacaoFornecedor(
    id,
    origemDaImportacaoFornecedor(importacao),
    { pagina, limite },
  );

  return (
    <PaginaPublicacaoFornecedorAdmin
      titulo="Publicação da importação"
      subtitulo={`Revise e confirme os produtos de ${importacao.nomeFornecedor} que entrarão no catálogo da loja.`}
      hrefVoltar={`/admin/fornecedores/importacoes/${id}?etapa=revisao`}
      rascunhosIniciais={resultado.rascunhos}
      paginacao={resultado.paginacao}
      montarHrefPagina={(mudancas) => {
        const parametros = new URLSearchParams();
        parametros.set(
          "pagina",
          String(mudancas.pagina ?? resultado.paginacao.pagina),
        );
        parametros.set(
          "limite",
          String(mudancas.limite ?? resultado.paginacao.limite),
        );
        return `/admin/fornecedores/importacoes/${id}/publicacao?${parametros.toString()}`;
      }}
      sessaoAtiva={Boolean(sessao?.user)}
      acaoPublicar={publicarProdutosImportacaoFornecedor.bind(null, id)}
    />
  );
}
