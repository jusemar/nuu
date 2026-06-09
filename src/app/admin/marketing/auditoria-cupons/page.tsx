import { PaginaAuditoriaCuponsAdmin } from "@/features/promocoes/components/admin/pagina-auditoria-cupons-admin";
import { listarAuditoriaCuponsAdmin } from "@/features/promocoes/queries";

type AuditoriaCuponsAdminPageProps = {
  searchParams?: Promise<{
    busca?: string;
    codigoCupom?: string;
    numeroPedido?: string;
    cliente?: string;
    statusPagamento?: string;
    pagina?: string;
  }>;
};

export default async function AuditoriaCuponsAdminPage({
  searchParams,
}: AuditoriaCuponsAdminPageProps) {
  const params = await searchParams;
  const filtros = {
    busca: params?.busca ?? "",
    codigoCupom: params?.codigoCupom ?? "",
    numeroPedido: params?.numeroPedido ?? "",
    cliente: params?.cliente ?? "",
    statusPagamento: params?.statusPagamento ?? "todos",
    pagina: Number(params?.pagina ?? 1),
  };
  const resultado = await listarAuditoriaCuponsAdmin({
    ...filtros,
    limite: 10,
  });

  return <PaginaAuditoriaCuponsAdmin resultado={resultado} filtros={filtros} />;
}
