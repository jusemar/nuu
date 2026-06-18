import { PaginaListaImportacoesFornecedoresAdmin } from "@/features/fornecedores/components/admin/pagina-lista-importacoes-fornecedores-admin";
import {
  listarFornecedoresAdmin,
  listarImportacoesRecentesFornecedoresAdmin,
} from "@/features/fornecedores/queries";

type ImportacoesFornecedoresPageProps = {
  searchParams: Promise<{
    pagina?: string;
    limite?: string;
  }>;
};

function numeroParametro(valor: string | undefined, padrao: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

export default async function Page({
  searchParams,
}: ImportacoesFornecedoresPageProps) {
  const parametros = await searchParams;
  const fornecedores = await listarFornecedoresAdmin();
  const pagina = numeroParametro(parametros.pagina, 1);
  const limite = numeroParametro(parametros.limite, 4);
  const recentes = await listarImportacoesRecentesFornecedoresAdmin({
    pagina,
    limite,
  });

  return (
    <PaginaListaImportacoesFornecedoresAdmin
      fornecedores={fornecedores}
      importacoesRecentes={recentes.itens}
      paginacaoImportacoesRecentes={recentes.paginacao}
      totaisStatusImportacoesRecentes={recentes.totaisStatus}
    />
  );
}
