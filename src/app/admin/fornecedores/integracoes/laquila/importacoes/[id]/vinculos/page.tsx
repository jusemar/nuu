import { notFound } from "next/navigation";

import { PaginaVinculosLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import {
  buscarImportacaoApiLaquila,
  listarProdutosVinculacaoLaquila,
  listarRascunhosConciliacaoLaquila,
  listarVinculosProdutosLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import {
  ESTAGIOS_VINCULACAO_FORNECEDOR,
  type EstagioVinculacaoFornecedor,
} from "@/features/fornecedores/queries/listar-staging-importacao-fornecedor-admin";

type VinculosImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    pagina?: string;
    limite?: string;
    busca?: string;
    estagio?: string;
  }>;
};

export default async function Page({
  params,
  searchParams,
}: VinculosImportacaoLaquilaPageProps) {
  const { id } = await params;
  const parametros = await searchParams;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const estagio = ESTAGIOS_VINCULACAO_FORNECEDOR.includes(
    parametros.estagio as EstagioVinculacaoFornecedor,
  )
    ? (parametros.estagio as EstagioVinculacaoFornecedor)
    : undefined;
  const identificacaoFornecedor = await listarVinculosProdutosLaquila([]);
  const paginaProdutos = await listarProdutosVinculacaoLaquila({
    importacaoId: importacao.id,
    fornecedorId: identificacaoFornecedor.fornecedorId,
    pagina: parametros.pagina,
    limite: parametros.limite,
    busca: parametros.busca,
    estagio,
  });
  const codigos = paginaProdutos.produtos.map((produto) => produto.cd_item);
  const [rascunhos, vinculos, sessao] = await Promise.all([
    listarRascunhosConciliacaoLaquila(importacao.id, codigos),
    listarVinculosProdutosLaquila(codigos),
    buscarSessaoFornecedoresAdmin(),
  ]);

  return (
    <PaginaVinculosLaquilaAdmin
      importacaoId={importacao.id}
      rascunhosIniciais={rascunhos}
      produtosIniciais={paginaProdutos.produtos}
      paginacao={paginaProdutos.paginacao}
      busca={parametros.busca ?? ""}
      estagio={estagio}
      fornecedorId={vinculos.fornecedorId}
      vinculosIniciais={vinculos.vinculos}
      sessaoAtiva={Boolean(sessao?.user)}
    />
  );
}
