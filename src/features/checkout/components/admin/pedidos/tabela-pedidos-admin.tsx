import Link from "next/link";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  PAGAMENTO_GATEWAY_LABEL,
  PAGAMENTO_METODO_LABEL,
} from "../../../constants/admin-pedidos";
import {
  formatarDataAdminPedido,
  formatarMoedaAdminPedido,
} from "../../../lib/admin-pedidos/formatar-admin-pedidos";
import type { PedidoAdminListaItem } from "../../../types/admin-pedidos.types";
import { PagamentoStatusBadge, PedidoStatusBadge } from "./status-pedido-badge";

export function TabelaPedidosAdmin({
  pedidos,
}: {
  pedidos: PedidoAdminListaItem[];
}) {
  if (pedidos.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Nenhum pedido encontrado
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Ajuste os filtros ou aguarde novos pedidos do checkout aparecerem
          aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Metodo</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell className="font-semibold text-slate-900">
                {pedido.numeroPedido}
              </TableCell>
              <TableCell>{pedido.cliente.nome}</TableCell>
              <TableCell className="text-slate-600">
                {pedido.cliente.email}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatarMoedaAdminPedido(pedido.totalEmCentavos)}
              </TableCell>
              <TableCell>
                <PedidoStatusBadge status={pedido.status} />
              </TableCell>
              <TableCell>
                <PagamentoStatusBadge status={pedido.pagamentoStatus} />
              </TableCell>
              <TableCell>{PAGAMENTO_GATEWAY_LABEL[pedido.gateway]}</TableCell>
              <TableCell>
                {pedido.metodoPagamento
                  ? PAGAMENTO_METODO_LABEL[pedido.metodoPagamento]
                  : "-"}
              </TableCell>
              <TableCell>{formatarDataAdminPedido(pedido.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/orders/${pedido.id}`}>
                    <Eye className="h-4 w-4" />
                    Ver
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
