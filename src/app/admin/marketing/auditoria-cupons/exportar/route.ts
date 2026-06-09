import { exportarAuditoriaCuponsAdminCsv } from "@/features/promocoes/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const csv = await exportarAuditoriaCuponsAdminCsv({
    periodoInicio: url.searchParams.get("periodoInicio") ?? undefined,
    periodoFim: url.searchParams.get("periodoFim") ?? undefined,
    statusPagamento: url.searchParams.get("statusPagamento") ?? undefined,
    codigoCupom: url.searchParams.get("codigoCupom") ?? undefined,
    gateway: url.searchParams.get("gateway") ?? undefined,
    inconsistencia: url.searchParams.get("inconsistencia") ?? undefined,
  });
  const nomeArquivo = `auditoria-cupons-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
