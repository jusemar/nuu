import { PaginaPromocoesAdmin } from "@/features/promocoes/components/admin/pagina-promocoes-admin";
import { listarPromocoesAdmin } from "@/features/promocoes/queries";

type PromocoesAdminPageProps = {
  searchParams: Promise<{
    busca?: string;
    status?: string;
    pagina?: string;
  }>;
};

export default async function PromocoesAdminPage({
  searchParams,
}: PromocoesAdminPageProps) {
  const filtrosUrl = await searchParams;
  const filtros = {
    busca: filtrosUrl.busca ?? "",
    status: filtrosUrl.status ?? "todos",
    pagina: Number(filtrosUrl.pagina ?? 1),
  };
  const resultado = await listarPromocoesAdmin({
    ...filtros,
    limite: 10,
  });

  return <PaginaPromocoesAdmin resultado={resultado} filtros={filtros} />;
}
