import { Badge } from "@/components/ui/badge";

import {
  PEDIDO_HISTORICO_ORIGEM_LABEL,
  PEDIDO_HISTORICO_TIPO_LABEL,
  PEDIDO_STATUS_LABEL,
} from "../../../constants/admin-pedidos";
import { formatarDataAdminPedido } from "../../../lib/admin-pedidos/formatar-admin-pedidos";
import type { PedidoAdminHistorico } from "../../../types/admin-pedidos.types";

export function TimelineHistoricoPedido({
  historicos,
}: {
  historicos: PedidoAdminHistorico[];
}) {
  if (historicos.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Nenhum evento registrado para este pedido.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {historicos.map((historico) => (
        <li key={historico.id} className="relative pl-6">
          <span className="absolute top-1.5 left-0 h-3 w-3 rounded-full border-2 border-white bg-slate-900 ring-2 ring-slate-200" />
          <div className="flex flex-col gap-2 rounded-md border bg-slate-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {PEDIDO_HISTORICO_TIPO_LABEL[historico.tipo]}
              </Badge>
              <Badge variant="secondary">
                {PEDIDO_HISTORICO_ORIGEM_LABEL[historico.origem]}
              </Badge>
              <span className="text-xs text-slate-500">
                {formatarDataAdminPedido(historico.createdAt)}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {historico.descricao}
            </p>
            {(historico.statusAnterior || historico.statusNovo) && (
              <p className="text-xs text-slate-600">
                {historico.statusAnterior
                  ? PEDIDO_STATUS_LABEL[historico.statusAnterior]
                  : "-"}{" "}
                {" -> "}
                {historico.statusNovo
                  ? PEDIDO_STATUS_LABEL[historico.statusNovo]
                  : "-"}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
