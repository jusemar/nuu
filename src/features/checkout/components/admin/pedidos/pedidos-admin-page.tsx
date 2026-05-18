import { PackageSearch } from "lucide-react";

import { filtrosPedidosAdminSchema } from "../../../schemas/admin-pedidos.schema";
import { listarPedidosAdmin } from "../../../queries/pedidos-admin/listar-pedidos-admin";
import { FiltrosPedidosAdmin } from "./filtros-pedidos-admin";
import { PaginacaoPedidosAdmin } from "./paginacao-pedidos-admin";
import { TabelaPedidosAdmin } from "./tabela-pedidos-admin";

type PedidosAdminPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function PedidosAdminPage({
  searchParams,
}: PedidosAdminPageProps) {
  const filtros = filtrosPedidosAdminSchema.parse(searchParams);
  const resultado = await listarPedidosAdmin(filtros);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <PackageSearch className="h-4 w-4" />
            Operacao
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe pedidos, pagamentos e dados operacionais do checkout.
          </p>
        </div>
        <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Mais recentes primeiro
        </div>
      </div>

      <FiltrosPedidosAdmin filtros={filtros} />

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <TabelaPedidosAdmin pedidos={resultado.pedidos} />
        {resultado.pedidos.length > 0 && (
          <PaginacaoPedidosAdmin
            filtros={filtros}
            page={resultado.page}
            totalPages={resultado.totalPages}
            total={resultado.total}
          />
        )}
      </div>
    </div>
  );
}
