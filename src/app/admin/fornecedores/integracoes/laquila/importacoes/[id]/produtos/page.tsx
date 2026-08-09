import { notFound } from "next/navigation";

import { PreviaProdutosLaquilaMock } from "@/features/fornecedores/integracoes/laquila/components/admin/previa-produtos-laquila-mock";
import {
  buscarImportacaoApiLaquila,
  enriquecerTriagemProdutosLaquila,
  listarProdutosImportacaoApiLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";

type ProdutosImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Produtos recebidos por UMA execução da API.
 *
 * Nenhuma chamada à Laquila acontece aqui: a página lê o staging que a
 * sincronização gravou. É isto que faz a retomada — reabrir amanhã mostra o
 * mesmo retrato e as mesmas decisões, sem recontatar o fornecedor.
 */
export default async function Page({
  params,
}: ProdutosImportacaoLaquilaPageProps) {
  const { id } = await params;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const resultado = await listarProdutosImportacaoApiLaquila(importacao);
  const produtosComTriagem = await enriquecerTriagemProdutosLaquila(
    resultado.produtos,
  );

  return (
    <PreviaProdutosLaquilaMock
      importacaoId={importacao.id}
      produtos={produtosComTriagem}
      totalRetornadoApi={importacao.totalLinhas}
      totalAposRecorte={resultado.totalAposRecorte}
      consultadoEm={resultado.consultadoEm ?? undefined}
    />
  );
}
