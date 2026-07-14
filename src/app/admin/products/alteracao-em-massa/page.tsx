import { PaginaAlteracaoEmMassaProdutosAdmin } from "@/features/products/components/admin/alteracao-em-massa/pagina-alteracao-em-massa-produtos-admin";
import { listarDadosAlteracaoEmMassa } from "@/features/products/queries/alteracao-em-massa/listar-dados-alteracao-em-massa";

export default async function AlteracaoEmMassaProdutosPage() {
  const resultado = await listarDadosAlteracaoEmMassa();

  return <PaginaAlteracaoEmMassaProdutosAdmin resultado={resultado} />;
}
