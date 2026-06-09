import { PaginaAuditoriaFreteGratisAdmin } from "@/features/promocoes/components/admin/pagina-auditoria-frete-gratis-admin";
import { listarAuditoriaFreteGratisAdmin } from "@/features/promocoes/queries";

type AuditoriaFreteGratisAdminPageProps = {
  searchParams?: Promise<{
    busca?: string;
    numeroPedido?: string;
    cliente?: string;
    statusPagamento?: string;
    regraFreteGratisId?: string;
    periodoInicio?: string;
    periodoFim?: string;
    pagina?: string;
  }>;
};

export default async function AuditoriaFreteGratisAdminPage({
  searchParams,
}: AuditoriaFreteGratisAdminPageProps) {
  const params = await searchParams;
  const filtros = {
    busca: params?.busca ?? "",
    numeroPedido: params?.numeroPedido ?? "",
    cliente: params?.cliente ?? "",
    statusPagamento: params?.statusPagamento ?? "todos",
    regraFreteGratisId: params?.regraFreteGratisId ?? "",
    periodoInicio: params?.periodoInicio ?? "",
    periodoFim: params?.periodoFim ?? "",
    pagina: Number(params?.pagina ?? 1),
  };
  const resultado = await listarAuditoriaFreteGratisAdmin({
    ...filtros,
    limite: 10,
  });

  return (
    <PaginaAuditoriaFreteGratisAdmin resultado={resultado} filtros={filtros} />
  );
}
