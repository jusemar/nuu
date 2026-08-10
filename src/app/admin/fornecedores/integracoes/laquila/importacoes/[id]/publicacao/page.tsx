import { notFound } from "next/navigation";

import { publicarProdutosImportacaoFornecedor } from "@/features/fornecedores/actions/publicar-produtos-importacao-fornecedor";
import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { buscarImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { ORIGEM_IMPORTACAO_API_LAQUILA } from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarRascunhosPublicacaoImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-publicacao-importacao-fornecedor";

type PublicacaoImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string; limite?: string }>;
};

/**
 * Publicação da execução da API, pela MESMA action do fluxo por arquivo.
 *
 * A action deriva a origem da importação, então publicar aqui respeita as
 * mesmas regras: só rascunhos desta execução, só quem está pronto, e o item
 * publicado vira terminal dentro do ciclo.
 */
export default async function Page({
  params,
  searchParams,
}: PublicacaoImportacaoLaquilaPageProps) {
  const { id } = await params;
  const { pagina, limite } = await searchParams;
  // A sessão não depende da importação: as duas leituras saem juntas.
  const [importacao, sessao] = await Promise.all([
    buscarImportacaoApiLaquila(id),
    buscarSessaoFornecedoresAdmin(),
  ]);

  if (!importacao) notFound();

  // A origem já é conhecida (esta rota só abre importação de API da Laquila),
  // então a query dos rascunhos não gasta uma ida ao banco para descobri-la.
  const resultado = await listarRascunhosPublicacaoImportacaoFornecedor(
    importacao.id,
    ORIGEM_IMPORTACAO_API_LAQUILA,
    { pagina, limite },
  );

  return (
    <PaginaPublicacaoFornecedorAdmin
      titulo="Publicação da importação"
      subtitulo={`Revise e confirme os produtos de ${importacao.nomeFornecedor} que entrarão no catálogo da loja.`}
      hrefVoltar={`/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/conciliacao`}
      hrefBasePaginacao={`/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/publicacao`}
      rascunhosIniciais={resultado.rascunhos}
      paginacao={resultado.paginacao}
      sessaoAtiva={Boolean(sessao?.user)}
      acaoPublicar={publicarProdutosImportacaoFornecedor.bind(
        null,
        importacao.id,
      )}
    />
  );
}
