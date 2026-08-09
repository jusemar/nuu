import { notFound } from "next/navigation";

import { PaginaMapeamentoLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";
import { listarOpcoesMapeamentoFornecedor } from "@/features/fornecedores/queries";

type MapeamentoImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
};

async function listarOpcoesMapeamentoLaquilaComFallback() {
  try {
    return await listarOpcoesMapeamentoFornecedor();
  } catch (erro) {
    console.error(
      "Não foi possível carregar opções reais para o mapeamento Laquila.",
      erro,
    );

    return {
      categoriasLoja: [],
      marcasLoja: [],
    };
  }
}

export default async function Page({
  params,
}: MapeamentoImportacaoLaquilaPageProps) {
  const { id } = await params;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const opcoesMapeamento = await listarOpcoesMapeamentoLaquilaComFallback();

  return (
    <PaginaMapeamentoLaquilaAdmin
      importacaoId={importacao.id}
      categoriasLoja={opcoesMapeamento.categoriasLoja}
      marcasLoja={opcoesMapeamento.marcasLoja}
    />
  );
}
