import { PaginaFornecedoresAdmin } from "@/features/fornecedores/components/admin/pagina-fornecedores-admin";
import { obterAmbienteAplicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/ambiente-laquila";
import {
  buscarProdutosParaVinculoFornecedor,
  listarFornecedoresAdmin,
  listarVinculosProdutosFornecedoresAdmin,
} from "@/features/fornecedores/queries";

type PageProps = {
  searchParams?: Promise<{
    fornecedorVinculoId?: string;
    buscaProdutoVinculo?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const ambienteLaquila = obterAmbienteAplicacaoLaquila();
  const filtros = await searchParams;
  const fornecedores = await listarFornecedoresAdmin();
  const fornecedorBuscaProdutoId = filtros?.fornecedorVinculoId ?? null;
  const buscaProdutoVinculo = filtros?.buscaProdutoVinculo ?? "";
  const [vinculosProdutos, produtosParaVinculo] = await Promise.all([
    listarVinculosProdutosFornecedoresAdmin(
      fornecedores.map((fornecedor) => fornecedor.id),
    ),
    fornecedorBuscaProdutoId && buscaProdutoVinculo
      ? buscarProdutosParaVinculoFornecedor({ busca: buscaProdutoVinculo })
      : Promise.resolve([]),
  ]);

  return (
    <PaginaFornecedoresAdmin
      fornecedores={fornecedores}
      vinculosProdutos={vinculosProdutos}
      produtosParaVinculo={produtosParaVinculo}
      fornecedorBuscaProdutoId={fornecedorBuscaProdutoId}
      buscaProdutoVinculo={buscaProdutoVinculo}
      ambienteLaquila={ambienteLaquila}
    />
  );
}
