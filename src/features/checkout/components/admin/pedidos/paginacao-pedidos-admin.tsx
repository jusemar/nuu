import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { montarUrlPedidosAdmin } from "../../../lib/admin-pedidos/montar-url-pedidos-admin";
import type { FiltrosPedidosAdmin } from "../../../schemas/admin-pedidos.schema";

export function PaginacaoPedidosAdmin({
  filtros,
  page,
  totalPages,
  total,
}: {
  filtros: FiltrosPedidosAdmin;
  page: number;
  totalPages: number;
  total: number;
}) {
  const paginaAnterior = Math.max(1, page - 1);
  const proximaPagina = Math.min(totalPages, page + 1);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        {total} pedido{total === 1 ? "" : "s"} encontrado
        {total === 1 ? "" : "s"}.
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={montarUrlPedidosAdmin(filtros, { page: paginaAnterior })}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          </Button>
        )}
        <span className="min-w-24 text-center text-sm text-slate-600">
          {page} de {totalPages}
        </span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Proxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={montarUrlPedidosAdmin(filtros, { page: proximaPagina })}
            >
              Proxima
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
