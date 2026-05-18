import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  PAGAMENTO_STATUS_LABEL,
  PEDIDO_STATUS_LABEL,
} from "../../../constants/admin-pedidos";
import type {
  PagamentoStatusCheckout,
  PedidoStatusCheckout,
} from "../../../types/pedidos-pagamentos.types";

const statusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-cyan-200 bg-cyan-50 text-cyan-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  canceled: "border-slate-200 bg-slate-50 text-slate-700",
  refunded: "border-violet-200 bg-violet-50 text-violet-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

export function PedidoStatusBadge({
  status,
}: {
  status: PedidoStatusCheckout;
}) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status])}>
      {PEDIDO_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PagamentoStatusBadge({
  status,
}: {
  status: PagamentoStatusCheckout;
}) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status])}>
      {PAGAMENTO_STATUS_LABEL[status]}
    </Badge>
  );
}
