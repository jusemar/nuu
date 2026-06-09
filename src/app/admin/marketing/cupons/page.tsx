import { PaginaCuponsPromocaoAdmin } from "@/features/promocoes/components/admin/pagina-cupons-promocao-admin";
import { listarCuponsPromocaoAdmin } from "@/features/promocoes/queries";

type CuponsPromocaoAdminPageProps = {
  searchParams: Promise<{
    busca?: string;
    status?: string;
    pagina?: string;
  }>;
};

export default async function CuponsPromocaoAdminPage({
  searchParams,
}: CuponsPromocaoAdminPageProps) {
  const filtrosUrl = await searchParams;
  const filtros = {
    busca: filtrosUrl.busca ?? "",
    status: filtrosUrl.status ?? "todos",
    pagina: Number(filtrosUrl.pagina ?? 1),
  };
  const resultado = await listarCuponsPromocaoAdmin({
    ...filtros,
    limite: 10,
  });

  return <PaginaCuponsPromocaoAdmin resultado={resultado} filtros={filtros} />;
}
