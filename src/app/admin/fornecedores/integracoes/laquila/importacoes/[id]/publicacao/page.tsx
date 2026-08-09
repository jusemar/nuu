import { notFound } from "next/navigation";

import { publicarProdutosImportacaoFornecedor } from "@/features/fornecedores/actions/publicar-produtos-importacao-fornecedor";
import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { buscarImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { listarRascunhosPublicacaoImportacaoFornecedor } from "@/features/fornecedores/queries/listar-rascunhos-publicacao-importacao-fornecedor";

type PublicacaoImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
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
}: PublicacaoImportacaoLaquilaPageProps) {
  const { id } = await params;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const [rascunhos, sessao] = await Promise.all([
    listarRascunhosPublicacaoImportacaoFornecedor(importacao.id),
    buscarSessaoFornecedoresAdmin(),
  ]);

  return (
    <PaginaPublicacaoFornecedorAdmin
      titulo="Publicação da importação"
      subtitulo={`Revise e confirme os produtos de ${importacao.nomeFornecedor} que entrarão no catálogo da loja.`}
      hrefVoltar={`/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/conciliacao`}
      rascunhosIniciais={rascunhos}
      sessaoAtiva={Boolean(sessao?.user)}
      acaoPublicar={publicarProdutosImportacaoFornecedor.bind(
        null,
        importacao.id,
      )}
    />
  );
}
