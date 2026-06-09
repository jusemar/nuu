import { PaginaImportacoesFornecedoresAdmin } from "@/features/fornecedores/components/admin/pagina-importacoes-fornecedores-admin";
import {
  buscarProdutosParaVinculoFornecedor,
  listarFornecedoresAdmin,
  listarImportacoesFornecedoresAdmin,
  listarStagingImportacaoFornecedor,
} from "@/features/fornecedores/queries";
import { gerarPreviewSincronizacaoFornecedor } from "@/features/fornecedores/services/gerar-preview-sincronizacao.service";

type FornecedoresImportacoesPageProps = {
  searchParams: Promise<{
    importacaoId?: string;
    aba?: string;
    vincularStagingId?: string;
    buscaProduto?: string;
  }>;
};

const abasPermitidas = ["todos", "localizado", "nao_localizado", "erro"];

export default async function Page({
  searchParams,
}: FornecedoresImportacoesPageProps) {
  const parametros = await searchParams;
  const fornecedores = await listarFornecedoresAdmin();
  const importacoes = await listarImportacoesFornecedoresAdmin();
  const importacaoSelecionadaId = parametros.importacaoId ?? importacoes[0]?.id;
  const abaSelecionada = abasPermitidas.includes(parametros.aba ?? "")
    ? (parametros.aba as "todos" | "localizado" | "nao_localizado" | "erro")
    : "todos";
  const staging = importacaoSelecionadaId
    ? await listarStagingImportacaoFornecedor(importacaoSelecionadaId)
    : [];
  const produtosParaVinculo = parametros.vincularStagingId
    ? await buscarProdutosParaVinculoFornecedor({
        busca: parametros.buscaProduto,
      })
    : [];
  const previewSincronizacao = importacaoSelecionadaId
    ? await gerarPreviewSincronizacaoFornecedor({
        importacaoId: importacaoSelecionadaId,
      })
    : null;

  return (
    <PaginaImportacoesFornecedoresAdmin
      fornecedores={fornecedores}
      importacoes={importacoes}
      staging={staging}
      importacaoSelecionadaId={importacaoSelecionadaId}
      abaSelecionada={abaSelecionada}
      vincularStagingId={parametros.vincularStagingId}
      buscaProduto={parametros.buscaProduto ?? ""}
      produtosParaVinculo={produtosParaVinculo}
      previewSincronizacao={previewSincronizacao}
    />
  );
}
