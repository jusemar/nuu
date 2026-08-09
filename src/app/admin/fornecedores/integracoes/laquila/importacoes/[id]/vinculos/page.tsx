import { notFound } from "next/navigation";

import { PaginaVinculosLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import {
  buscarImportacaoApiLaquila,
  listarRascunhosConciliacaoLaquila,
  listarVinculosProdutosLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

type VinculosImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({
  params,
}: VinculosImportacaoLaquilaPageProps) {
  const { id } = await params;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const [rascunhos, vinculos, sessao] = await Promise.all([
    // Rascunhos são DESTA execução...
    listarRascunhosConciliacaoLaquila(importacao.id),
    // ...e os vínculos são permanentes do fornecedor, reaproveitados por todas.
    listarVinculosProdutosLaquila(),
    buscarSessaoFornecedoresAdmin(),
  ]);

  return (
    <PaginaVinculosLaquilaAdmin
      importacaoId={importacao.id}
      rascunhosIniciais={rascunhos}
      fornecedorId={vinculos.fornecedorId}
      vinculosIniciais={vinculos.vinculos}
      sessaoAtiva={Boolean(sessao?.user)}
    />
  );
}
