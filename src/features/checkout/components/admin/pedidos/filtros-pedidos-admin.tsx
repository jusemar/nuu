import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  PAGAMENTO_METODO_LABEL,
  PAGAMENTO_STATUS_LABEL,
  PEDIDO_STATUS_LABEL,
} from "../../../constants/admin-pedidos";
import {
  PAGAMENTO_METODOS_CHECKOUT,
  PAGAMENTO_STATUS_CHECKOUT,
  PEDIDO_STATUS_CHECKOUT,
} from "../../../constants/pedidos-pagamentos";
import type { FiltrosPedidosAdmin } from "../../../schemas/admin-pedidos.schema";

export function FiltrosPedidosAdmin({
  filtros,
}: {
  filtros: FiltrosPedidosAdmin;
}) {
  return (
    <form
      action="/admin/orders"
      className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_180px_auto]"
    >
      <div>
        <label
          htmlFor="numeroPedido"
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          Numero do pedido
        </label>
        <Input
          id="numeroPedido"
          name="numeroPedido"
          defaultValue={filtros.numeroPedido ?? ""}
          placeholder="#123"
        />
      </div>

      <div>
        <label
          htmlFor="emailCliente"
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          Email do cliente
        </label>
        <Input
          id="emailCliente"
          name="emailCliente"
          defaultValue={filtros.emailCliente ?? ""}
          placeholder="cliente@email.com"
          type="search"
        />
      </div>

      <div>
        <label
          htmlFor="statusPedido"
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          Status pedido
        </label>
        <select
          id="statusPedido"
          name="statusPedido"
          defaultValue={filtros.statusPedido ?? ""}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        >
          <option value="">Todos</option>
          {PEDIDO_STATUS_CHECKOUT.map((status) => (
            <option key={status} value={status}>
              {PEDIDO_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="statusPagamento"
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          Status pagamento
        </label>
        <select
          id="statusPagamento"
          name="statusPagamento"
          defaultValue={filtros.statusPagamento ?? ""}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        >
          <option value="">Todos</option>
          {PAGAMENTO_STATUS_CHECKOUT.map((status) => (
            <option key={status} value={status}>
              {PAGAMENTO_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="metodoPagamento"
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          Metodo
        </label>
        <select
          id="metodoPagamento"
          name="metodoPagamento"
          defaultValue={filtros.metodoPagamento ?? ""}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        >
          <option value="">Todos</option>
          {PAGAMENTO_METODOS_CHECKOUT.map((metodo) => (
            <option key={metodo} value={metodo}>
              {PAGAMENTO_METODO_LABEL[metodo]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" className="w-full md:w-auto">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
